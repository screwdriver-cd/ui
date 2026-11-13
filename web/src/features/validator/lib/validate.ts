import { api, ApiError } from '~/api/client';

export type YamlKind =
  | 'command'
  | 'pipelineTemplate'
  | 'jobTemplate'
  | 'pipeline';

/** Simple tests on the raw text, same rules as app/validator/service.js. */
export const isCommand = (yaml: string) =>
  /^format:\s*(binary|habitat|docker)/m.test(yaml);
export const isJobTemplate = (yaml: string) =>
  /^name|\n+name: |\n+namespace: /.test(yaml);
export const isPipelineTemplate = (yaml: string) =>
  /^(?=.*\bnamespace:)(?=.*\bname:)(?=.*\bconfig:.*\bjobs:).*/s.test(yaml);

export function detectKind(yaml: string): YamlKind {
  if (isCommand(yaml)) {
    return 'command';
  }
  if (isPipelineTemplate(yaml)) {
    return 'pipelineTemplate';
  }
  if (isJobTemplate(yaml)) {
    return 'jobTemplate';
  }

  return 'pipeline';
}

const ENDPOINTS: Record<YamlKind, string> = {
  command: '/validator/command',
  pipelineTemplate: '/pipeline/template/validate',
  jobTemplate: '/validator/template',
  pipeline: '/validator'
};

export type Message = string | { message: string };

export interface ValidationResult {
  errors?: Message[];
  warnMessages?: Message[];
  jobs?: Record<string, JobConfig[]>;
  stages?: Record<string, { description?: string }>;
  workflowGraph?: {
    nodes: Array<{ name: string; id?: number }>;
    edges: Array<{ src: string; dest: string; join?: boolean }>;
  };
  annotations?: Record<string, unknown>;
  parameters?: Record<string, unknown>;
  cache?: Record<string, unknown>;
  subscribe?: Record<string, unknown>;
  command?: Record<string, unknown> & {
    namespace?: string;
    name?: string;
    version?: string;
  };
  template?: Record<string, unknown> & {
    namespace?: string;
    name?: string;
    version?: string;
    config?: Record<string, unknown> & { jobs?: Record<string, JobConfig> };
  };
}

export interface JobConfig {
  image?: string;
  description?: string;
  commands?: Array<{ name: string; command: string }>;
  steps?: Array<Record<string, unknown>>;
  environment?: Record<string, unknown>;
  [key: string]: unknown;
}

export const messageText = (m: Message) =>
  typeof m === 'string' ? m : m.message;

/**
 * Posts the yaml to the matching validator endpoint. Failures never throw:
 * like Ember they come back as `{ errors: ["<status> - <reason>"] }`.
 */
export async function validateYaml(
  yaml: string,
  signal?: AbortSignal
): Promise<ValidationResult> {
  try {
    return await api.post<ValidationResult>(
      ENDPOINTS[detectKind(yaml)],
      { yaml },
      { signal }
    );
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }
    if (error instanceof ApiError) {
      const body = (error.body ?? {}) as { message?: string; error?: string };
      const reason = body.message ?? body.error ?? 'Request Failed';

      return {
        errors: [error.status === 400 ? reason : `${error.status} - ${reason}`]
      };
    }

    return { errors: ['Request Failed'] };
  }
}
