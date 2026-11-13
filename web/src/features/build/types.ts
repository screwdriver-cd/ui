export interface BuildStep {
  name: string;
  startTime?: string;
  endTime?: string;
  code?: number | null;
  lines?: number;
}

export interface BuildStats {
  queueEnterTime?: string;
  blockedStartTime?: string;
  imagePullStartTime?: string;
  hostname?: string;
}

export interface Build {
  id: number;
  jobId: number;
  eventId: number;
  number?: number;
  container?: string;
  buildContainer?: string;
  cause?: string;
  sha: string;
  createTime?: string;
  startTime?: string;
  endTime?: string;
  status: string;
  statusMessage?: string | null;
  statusMessageType?: string | null;
  templateId?: number | null;
  stats?: BuildStats;
  steps: BuildStep[];
  meta?: {
    build?: { warning?: Record<string, string>; coverageKey?: string };
    parameters?: Record<string, unknown>;
    tests?: Record<string, unknown>;
  };
}

export interface Job {
  id: number;
  name: string;
  pipelineId: number;
  state?: string;
  prParentJobId?: number;
  /** The API stores job annotations under the first permutation. */
  permutations?: { annotations?: Record<string, unknown> }[];
  annotations?: Record<string, string>;
}

export interface BuildEvent {
  id: number;
  type?: string;
  sha?: string;
  causeMessage?: string;
  commit?: {
    message?: string;
    url?: string;
    author?: { name?: string; username?: string; url?: string };
  };
  pr?: { url?: string; title?: string };
}

export interface PipelineSummary {
  id: number;
  name?: string;
  state?: string;
  scmContext?: string;
}

export interface LogLine {
  /** Epoch ms */
  t?: number;
  m: string;
  n?: number;
}

export interface ArtifactNode {
  text: string;
  type: 'file' | 'directory';
  /** Path relative to the artifacts root, e.g. `coverage/index.html`. */
  path: string;
  children: ArtifactNode[];
}
