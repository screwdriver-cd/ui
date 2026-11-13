import { useQuery } from '@tanstack/react-query';
import { api, ApiError } from '~/api/client';
import { useSession } from '~/auth/session';
import { useScmContexts } from '~/features/search/lib/api';

export interface JobTemplate {
  id?: number;
  name: string;
  namespace: string;
  trusted?: boolean;
}

export function useTrustedTemplates(enabled: boolean) {
  return useQuery({
    queryKey: ['create-templates'],
    queryFn: async () => {
      const all = await api.get<JobTemplate[]>('/templates', {
        query: { sortBy: 'createTime', sort: 'descending', compact: true }
      });

      return all.filter(template => template.trusted === true);
    },
    enabled,
    staleTime: 60_000
  });
}

/** Whether the signed-in SCM lets Screwdriver generate deploy keys automatically. */
export function useAutoDeployKeys(): boolean {
  const scmContext = useSession(s => s.data?.scmContext);
  const { data = [] } = useScmContexts();
  const scm = data.find(context => context.context === scmContext) as
    | { autoDeployKeyGeneration?: boolean }
    | undefined;

  return scm?.autoDeployKeyGeneration === true;
}

export interface CreatedPipeline {
  id: number;
  scmRepo?: { branch?: string };
}

export interface CreatePayload {
  checkoutUrl: string;
  rootDir: string;
  autoKeysGeneration: boolean;
}

export class ExistingPipelineError extends Error {
  constructor(readonly existingId: number) {
    super(`Pipeline ${existingId} already exists`);
  }
}

export async function createPipeline(
  payload: CreatePayload
): Promise<CreatedPipeline> {
  try {
    return await api.post<CreatedPipeline>('/pipelines', payload);
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) {
      const existingId = (
        error.body as { data?: { existingId?: number } } | undefined
      )?.data?.existingId;

      if (existingId) {
        throw new ExistingPipelineError(existingId);
      }
    }
    throw error;
  }
}

/**
 * Opens an "Onboard to Screwdriver" PR that adds screwdriver.yaml, inside `rootDir` when the
 * pipeline has one (the API writes each file at the path it is given). Resolves to the PR url.
 */
export async function openOnboardingPr(
  pipelineId: number,
  checkoutUrl: string,
  yaml: string,
  rootDir = ''
): Promise<string> {
  const dir = rootDir.trim().replace(/^\/+|\/+$/g, '');

  const response = await api.post<{
    prUrl?: string;
    payload?: { prUrl?: string };
  }>(`/pipelines/${pipelineId}/openPr`, {
    checkoutUrl,
    files: [
      {
        name: dir ? `${dir}/screwdriver.yaml` : 'screwdriver.yaml',
        content: yaml
      }
    ],
    title: 'Onboard to Screwdriver',
    message: 'Add screwdriver.yaml file'
  });

  return response?.prUrl ?? response?.payload?.prUrl ?? '';
}
