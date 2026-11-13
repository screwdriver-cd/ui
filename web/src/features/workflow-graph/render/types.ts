import type {
  BuildLite,
  JobLite,
  PipelineStage,
  StageBuildLite,
  WorkflowGraphData
} from '../types';
import type { DownstreamTrigger } from '../decorate/filter';
import type { ActiveTab } from '../decorate/eligibility';

/** What the host app needs to know about a clicked job node. */
export interface WorkflowNodeInfo {
  name: string;
  displayName?: string;
  /** Job id from the workflow graph (PR jobs: the PR job id when `jobs` is provided). */
  jobId?: number;
  buildId?: number;
  status?: string;
  stageName?: string;
  description?: string;
  isDisabled?: boolean;
  stateChanger?: string;
  /** Reason given when the job was enabled/disabled (Ember: `stateChangeMessage`). */
  stateChangeMessage?: string;
  manualStartDisabled?: boolean;
  /** Can be (re)started from the active tab, not disabled and not read-only. */
  canStart: boolean;
  /** Has an active (queued/running/blocked/created) or FROZEN build that can be stopped. */
  canStop: boolean;
  /** Can be enabled/disabled (a real job and not read-only). */
  canToggle: boolean;
}

export interface WorkflowStageInfo {
  name: string;
  id?: number;
  stageBuildId?: number;
  status?: string;
  /** `screwdriver.cd/manualStartEnabled: false` on the stage. */
  manualStartDisabled?: boolean;
  /** The graph is read-only: no run actions at all. */
  readOnly?: boolean;
  canStart: boolean;
}

/** `restart` inherits the event's metadata and build statuses; `start` is a fresh run. */
export type RunMode = 'start' | 'restart';

/** Emitted by the graph. The host performs the API call / navigation. */
export type JobAction =
  | { type: 'view-build'; node: WorkflowNodeInfo }
  | { type: 'start'; node: WorkflowNodeInfo }
  | { type: 'restart'; node: WorkflowNodeInfo }
  | { type: 'stop'; node: WorkflowNodeInfo }
  | { type: 'toggle-job'; node: WorkflowNodeInfo }
  | { type: 'view-metrics'; node: WorkflowNodeInfo }
  | { type: 'start-stage'; stage: WorkflowStageInfo; action: RunMode }
  | { type: 'open-external'; pipelineId: string; jobName?: string };

export interface WorkflowGraphProps {
  /** API `workflowGraph` of the event (or pipeline). */
  graph: WorkflowGraphData;
  builds?: BuildLite[];
  stageBuilds?: StageBuildLite[];
  jobs?: JobLite[];
  /** Pipeline stage definitions. Without them stage nodes render as plain jobs. */
  stages?: PipelineStage[];
  /** Commit SHA of the event, shown as "Run job at #sha". */
  sha?: string;
  /** Node that started the event: `~commit`, `~pr`, `~commit:branch`, ... */
  start?: string;
  chainPR?: boolean;
  prNum?: number;
  /** The event shown. Changing it closes an open popover, whose actions belong to the old event. */
  eventId?: number;
  /** `pulls` restricts starting to jobs reachable from `~pr`. Default `events`. */
  activeTab?: ActiveTab;
  /** Adds `~sd-<job>-triggers` nodes and drops leaf external jobs. */
  downstreamTriggers?: DownstreamTrigger[];
  /** Job id (`WorkflowNodeInfo.jobId`) to select: pins the lens on it and centres the view. */
  selectedJobId?: number | string | null;
  /** Node name to select, for graphs without job ids (validator). Takes precedence over `selectedJobId`. */
  selectedNode?: string | null;
  /** Node names to emphasise: every other node is dimmed. A search query takes precedence while typed. */
  highlightNodes?: ReadonlySet<string> | null;
  /** Fires when a job node is clicked (before the popover opens). */
  onSelectJob?: (node: WorkflowNodeInfo | null) => void;
  /** Fires when an action is chosen from the node popover. */
  onJobAction?: (action: JobAction) => void;
  /** Hides Start/Restart/Stop. */
  readOnly?: boolean;
  /** Open the node popover on click. Default true; off where a click only selects (validator). */
  popover?: boolean;
  /** Controlled collapsed stages. Omit for internal state. */
  collapsedStages?: ReadonlySet<string>;
  onCollapsedStagesChange?: (next: Set<string>) => void;
  /** Controlled label visibility. Omit for internal state (default true). */
  showLabels?: boolean;
  onShowLabelsChange?: (next: boolean) => void;
  /** `mini`: static thumbnail with no interaction, controls, labels or minimap. */
  variant?: 'full' | 'mini';
  /** Show the minimap. Default: when the graph has more than 30 nodes. */
  minimap?: boolean;
  /**
   * A graph that would fit only below this zoom opens at it instead, centred on the active job
   * (or where a finished event started). Default LEGIBLE_ZOOM.
   */
  legibleZoom?: number;
  className?: string;
}
