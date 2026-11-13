/** Shared types for the workflow graph feature. Mirrors the API payloads. */

export type BuildStatus =
  | 'SUCCESS'
  | 'FAILURE'
  | 'RUNNING'
  | 'QUEUED'
  | 'BLOCKED'
  | 'ABORTED'
  | 'UNSTABLE'
  | 'COLLAPSED'
  | 'FROZEN'
  | 'SKIPPED'
  | 'CREATED'
  | 'DISABLED'
  | 'WARNING'
  | 'STARTED_FROM'
  | 'DOWNSTREAM_TRIGGER'
  | (string & {});

/** A node of the API `workflowGraph`. */
export interface WorkflowNode {
  name: string;
  id?: number;
  displayName?: string | number;
  stageName?: string;
  virtual?: boolean;
  /** `JOB_GROUP` for a collapsed stage. */
  type?: string;
  description?: string;
  /** Present on downstream-trigger nodes. */
  triggers?: string[];
  status?: BuildStatus;
}

/** An edge of the API `workflowGraph`. `join: true` means AND-join (wait for all). */
export interface WorkflowEdge {
  src: string;
  dest: string;
  join?: boolean;
}

export interface WorkflowGraphData {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface BuildLite {
  id: number;
  jobId: number | string;
  status: BuildStatus;
  /** A single parent, or several for joins. */
  parentBuildId?: number | string | Array<number | string> | null;
  eventId?: number;
  startTime?: string;
  endTime?: string;
}

export interface StageBuildLite {
  id: number;
  stageId: number | string;
  status: BuildStatus;
}

export interface JobLite {
  id: number;
  name: string;
  group?: number;
  isDisabled?: boolean;
  state?: string;
  stateChanger?: string;
  stateChangeMessage?: string;
  prParentJobId?: number;
  description?: string;
  permutations?: Array<{ annotations?: Record<string, unknown>; description?: string }>;
}

export interface PipelineStage {
  id: number;
  name: string;
  description?: string;
  annotations?: Record<string, unknown>;
  /** Id of the stage's setup job. */
  setup?: number;
  [key: string]: unknown;
}
