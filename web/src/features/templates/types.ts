export interface TemplateMetrics {
  jobs: { count: number | string };
  builds: { count: number | string };
  pipelines: { count: number | string; ids?: number[] };
}

/** Job template, pipeline template or command row, as shown in lists and version tables. */
export interface TemplateItem {
  id?: number;
  name: string;
  namespace: string;
  fullName: string;
  version: string;
  description: string;
  maintainer: string;
  createTime?: string;
  updateTime?: string;
  lastUpdated?: string;
  trusted?: boolean;
  trustedSinceVersion?: string;
  latest?: boolean;
  pipelineId?: number;
  tag?: string;
  labels?: string[];
  compatibilities?: { clouds?: string[]; architectures?: string[] };
  config?: Record<string, unknown>;
  workflowGraph?: unknown;
  metrics?: TemplateMetrics;
}

export interface TemplateTag {
  tag: string;
  version: string;
}

export interface UsagePipeline {
  id: number;
  name: string;
  lastRun: string | null;
  scmRepo: { url: string; branch: string; rootDir?: string };
  admins: Record<string, boolean>;
}
