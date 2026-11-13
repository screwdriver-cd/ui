/** Shapes returned by the Screwdriver API (only the fields this feature reads). */

export interface ScmRepo {
  name: string;
  branch: string;
  url: string;
  rootDir?: string;
  private?: boolean;
}

export interface PipelineSettings {
  public?: boolean;
  aliasName?: string;
  showEventTriggers?: boolean;
  filterSchedulerEvents?: boolean;
  filterEventsForNoBuilds?: boolean;
  metricsDowntimeJobs?: number[];
  [key: string]: unknown;
}

export interface WorkflowGraphNode {
  id?: number;
  name: string;
  displayName?: string;
  [key: string]: unknown;
}

export interface WorkflowGraphEdge {
  src: string;
  dest: string;
  join?: boolean;
  [key: string]: unknown;
}

export interface WorkflowGraph {
  nodes: WorkflowGraphNode[];
  edges: WorkflowGraphEdge[];
}

export interface Pipeline {
  id: number;
  name?: string;
  scmUri?: string;
  scmContext?: string;
  scmRepo?: ScmRepo;
  state?: 'ACTIVE' | 'INACTIVE' | 'DISABLED';
  stateChanger?: string;
  stateChangeTime?: string;
  stateChangeMessage?: string;
  configPipelineId?: number | null;
  childPipelines?: { scmUrls?: string[] };
  lastEventId?: number | null;
  admins?: Record<string, boolean>;
  annotations?: Record<string, unknown>;
  badges?: {
    sonar?: {
      name?: string;
      uri?: string;
      defaultName?: string;
      defaultUri?: string;
    };
  };
  settings?: PipelineSettings;
  parameters?: Record<string, unknown>;
  prChain?: boolean;
  workflowGraph?: WorkflowGraph;
}

export interface Person {
  username?: string;
  name?: string;
  url?: string;
  avatar?: string;
}

export interface SdEvent {
  id: number;
  pipelineId: number;
  groupEventId: number;
  parentEventId?: number;
  type: 'pipeline' | 'pr';
  prNum?: number;
  pr?: { url?: string };
  sha: string;
  startFrom?: string;
  causeMessage?: string;
  createTime: string;
  creator: Person;
  commit: { message: string; url?: string; author: Person };
  workflowGraph?: WorkflowGraph;
  meta?: {
    label?: string;
    parameters?: Record<string, unknown>;
    subscribedSourceUrl?: string;
    [key: string]: unknown;
  };
}

export interface Build {
  id: number;
  jobId: number;
  eventId?: number;
  status: string;
  createTime: string;
  startTime?: string;
  endTime?: string;
  sha?: string;
  meta?: { build?: { warning?: unknown }; [key: string]: unknown };
  stats?: Record<string, unknown>;
  coverage?: string;
}

export interface Job {
  id: number;
  name: string;
  pipelineId: number;
  state: 'ENABLED' | 'DISABLED';
  archived?: boolean;
  prParentJobId?: number;
  /** PR number for PR jobs. */
  group?: number;
  stateChanger?: string;
  stateChangeTime?: string;
  stateChangeMessage?: string;
  permutations?: Array<{
    annotations?: Record<string, unknown>;
    stage?: { name: string };
    parameters?: Record<string, unknown>;
  }>;
}

export interface Stage {
  id: number;
  pipelineId?: number;
  name: string;
  description?: string;
  jobIds?: number[];
  annotations?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface StageBuild {
  id: number;
  stageId: number;
  eventId?: number;
  status: string;
}

/** `GET /pipelines/:id/triggers`: external pipelines each job triggers. */
export interface JobTriggers {
  jobName: string;
  triggers: string[];
}

export interface Secret {
  id: number;
  pipelineId?: number;
  name: string;
  allowInPR: boolean;
}

export interface Token {
  id: number;
  name: string;
  description?: string;
  lastUsed?: string;
  expiresAt?: string;
  value?: string;
  options?: { permission?: string };
}

export interface ScmContext {
  context: string;
  displayName: string;
  readOnly?: boolean;
}

export interface AdminUser {
  username: string;
  scmContext: string;
}

export interface MetricBuild {
  id: number;
  jobId: number;
  duration: number;
  queuedTime?: number;
  imagePullTime?: number;
  status: string;
}

export interface Metric {
  id: number;
  createTime: string;
  sha?: string;
  status: string;
  duration: number;
  queuedTime: number;
  imagePullTime: number;
  builds?: MetricBuild[];
}
