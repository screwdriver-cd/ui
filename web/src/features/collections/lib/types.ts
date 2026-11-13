export interface ScmRepo {
  name: string;
  branch: string;
  url: string;
  rootDir?: string;
}

export interface PipelineSummary {
  id: number;
  name?: string;
  scmContext?: string;
  scmRepo: ScmRepo;
  settings?: { aliasName?: string };
}

export type CollectionType = 'default' | 'normal';

export interface Collection {
  id: number;
  name: string;
  description?: string;
  type: CollectionType;
  pipelineIds: number[];
  pipelines?: PipelineSummary[];
}

/** One entry of GET /pipelines/:id/metrics. */
export interface EventMetric {
  id?: number;
  createTime: string;
  status: string;
  duration?: number;
  sha?: string;
  commit?: { message?: string; url?: string };
  builds?: Array<{ meta?: { build?: { warning?: unknown } } }>;
}
