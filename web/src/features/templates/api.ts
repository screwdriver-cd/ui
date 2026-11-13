import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '~/api/client';
import { useSession } from '~/auth/session';
import { compareVersions, formatTemplates } from './format';
import type { TemplateItem, TemplateTag, UsagePipeline } from './types';

const enc = encodeURIComponent;
const LIST_QUERY = { sortBy: 'createTime', sort: 'descending' } as const;

export function useIsAdmin() {
  return useSession(s => !!s.data?.scope?.includes('admin'));
}

export function useJobTemplates(namespace?: string) {
  return useQuery({
    queryKey: ['templates', 'job', namespace ?? null],
    queryFn: async ({ signal }) =>
      formatTemplates(
        await api.get<TemplateItem[]>('/templates', {
          query: { compact: true, ...LIST_QUERY, namespace },
          signal
        }),
        { dedupe: true }
      )
  });
}

export function usePipelineTemplates(namespace?: string) {
  return useQuery({
    queryKey: ['templates', 'pipeline', namespace ?? null],
    queryFn: async ({ signal }) =>
      formatTemplates(
        await api
          .get<TemplateItem[]>('/pipeline/templates', {
            query: { ...LIST_QUERY, namespace },
            signal
          })
          // The API answers an empty list with 404 ("Pipeline templates do not exist").
          .catch(e => {
            if (e instanceof ApiError && e.status === 404) return [];
            throw e;
          }),
        { dedupe: true }
      ).map(t => (t.trustedSinceVersion ? { ...t, trusted: true } : t))
  });
}

/** One job template: every version (+ metrics), the metrics for a time window, and tags. */
export function useJobTemplate(
  namespace: string,
  name: string,
  range: { startTime: string; endTime: string }
) {
  const full = `${namespace}/${name}`;
  const all = useQuery({
    queryKey: ['template', 'job', full, 'all'],
    queryFn: async ({ signal }) => {
      const versions = formatTemplates(
        await api.get<TemplateItem[]>(`/templates/${enc(full)}/metrics`, {
          signal
        })
      ).filter(t => t.namespace === namespace);

      if (versions.length === 0) {
        throw new ApiError(404, undefined, 'Template not found');
      }

      return versions;
    }
  });
  const filtered = useQuery({
    queryKey: [
      'template',
      'job',
      full,
      'filtered',
      range.startTime,
      range.endTime
    ],
    queryFn: async ({ signal }) =>
      formatTemplates(
        await api.get<TemplateItem[]>(`/templates/${enc(full)}/metrics`, {
          query: range,
          signal
        })
      ),
    placeholderData: previous => previous
  });
  const tags = useQuery({
    queryKey: ['template', 'job', full, 'tags'],
    queryFn: ({ signal }) =>
      api.get<TemplateTag[]>(`/templates/${enc(full)}/tags`, { signal })
  });

  return { all, filtered, tags };
}

export interface PipelineTemplateMeta {
  pipelineId?: number;
  trustedSinceVersion?: string;
}

export function usePipelineTemplate(namespace: string, name: string) {
  return useQuery({
    queryKey: ['template', 'pipeline', namespace, name],
    queryFn: async ({ signal }) => {
      const base = `/pipeline/templates/${enc(namespace)}/${enc(name)}`;
      const meta = await api.get<PipelineTemplateMeta>(
        `/pipeline/template/${enc(namespace)}/${enc(name)}`,
        { signal }
      );
      const [tags, versions] = await Promise.all([
        api.get<TemplateTag[]>(`${base}/tags`, { signal }),
        api.get<TemplateItem[]>(`${base}/versions`, { signal })
      ]);
      const { trustedSinceVersion, pipelineId } = meta;
      const full = `${namespace}/${name}`;

      return {
        meta,
        tags,
        versions: versions.map(v => ({
          ...v,
          description: v.description ?? '',
          trusted:
            !!trustedSinceVersion &&
            compareVersions(v.version, trustedSinceVersion) >= 0
              ? true
              : v.trusted,
          pipelineId,
          name,
          namespace,
          fullName: full,
          tag: tags
            .filter(t => t.version === v.version)
            .map(t => t.tag)
            .join(' '),
          metrics: {
            jobs: { count: '' },
            builds: { count: '' },
            pipelines: { count: '' }
          }
        })) as TemplateItem[]
      };
    }
  });
}

export function useTemplateUsage(
  namespace: string,
  name: string,
  version: string
) {
  return useQuery({
    queryKey: ['template-usage', namespace, name, version],
    queryFn: ({ signal }) =>
      api.get<UsagePipeline[]>(
        `/templates/${enc(`${namespace}/${name}`)}/${enc(
          version
        )}/usage/pipelines`,
        { signal }
      )
  });
}

export function usePipelineScmUrl(pipelineId: number | undefined) {
  return useQuery({
    queryKey: ['pipeline-scm-url', pipelineId],
    enabled: pipelineId !== undefined,
    retry: false,
    queryFn: async ({ signal }) =>
      (
        await api.get<{ scmRepo?: { url?: string } }>(
          `/pipelines/${pipelineId}`,
          { signal }
        )
      ).scmRepo?.url ?? null
  });
}

/** Error text rules from the Ember template service (`403` and `401` get a permission message). */
export function mutationMessage(
  e: unknown,
  permission: string,
  opts: { onlyForbidden?: boolean } = {}
): string {
  if (e instanceof ApiError) {
    if (e.status === 403 || (!opts.onlyForbidden && e.status === 401)) {
      return permission;
    }
    const body = e.body as { error?: string } | undefined;

    return body && typeof body === 'object' && body.error
      ? `${e.status} ${body.error}`
      : `${e.status} Request Failed`;
  }

  return (e as Error).message;
}

export function useTemplateMutations(
  kind: 'job' | 'pipeline',
  namespace: string,
  name: string
) {
  const qc = useQueryClient();
  const full = `${namespace}/${name}`;
  const invalidate = () => qc.invalidateQueries({ queryKey: ['template'] });
  const base =
    kind === 'job'
      ? `/templates/${enc(full)}`
      : `/pipeline/templates/${enc(namespace)}/${enc(name)}`;

  return {
    remove: useMutation({
      mutationFn: () => api.delete(base),
      onSuccess: () => qc.invalidateQueries({ queryKey: ['templates'] })
    }),
    removeVersion: useMutation({
      mutationFn: (version: string) =>
        api.delete(
          `${base}/versions/${kind === 'job' ? enc(version) : version}`
        ),
      onSuccess: invalidate
    }),
    trust: useMutation({
      mutationFn: (trusted: boolean) => api.put(`${base}/trusted`, { trusted }),
      onSuccess: invalidate
    })
  };
}

export function useUtcPreference() {
  const authed = useSession(s => !!s.data);
  const q = useQuery({
    queryKey: ['user-settings'],
    enabled: authed,
    queryFn: () => api.get<{ timestampFormat?: string }>('/users/settings')
  });

  return q.data?.timestampFormat === 'UTC';
}
