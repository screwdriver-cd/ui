export type LayoutNodeKind =
  | 'job'
  | 'trigger'
  | 'external'
  | 'downstream'
  | 'stage-group';

export interface LayoutNodeInput {
  id: string;
  kind: LayoutNodeKind;
  width: number;
  height: number;
  /** Expanded stage this node lives in (laid out inside the stage box). */
  stage?: string;
}

export interface LayoutStageInput {
  name: string;
  jobIds: string[];
}

export interface LayoutEdgeInput {
  id: string;
  src: string;
  dest: string;
  /** Hidden bypass edges are only used to order nodes and to attach stage boxes. */
  hidden?: boolean;
}

/** Everything the layout depends on. Statuses are deliberately absent. */
export interface LayoutInput {
  nodes: LayoutNodeInput[];
  edges: LayoutEdgeInput[];
  stages: LayoutStageInput[];
  /** Thumbnail scale (mini variant): tiny nodes and tight spacing. Part of the layout key. */
  compact?: boolean;
}

export interface PlacedNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  /** Stage box id (`stage:<name>`) for nodes inside an expanded stage. x/y are absolute. */
  parentId?: string;
}

export interface PlacedStage {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PlacedEdge {
  id: string;
  src: string;
  dest: string;
  /** Endpoints actually used for layout (stage boxes replace hidden inner endpoints). */
  layoutSrc: string;
  layoutDest: string;
  /** Polyline routed by ELK, absolute coordinates. May be empty for edges inside a stage. */
  points: Array<{ x: number; y: number }>;
  hidden: boolean;
  /** Points right-to-left: a cycle back-edge. */
  backward: boolean;
}

export interface LayoutResult {
  key: string;
  nodes: PlacedNode[];
  stages: PlacedStage[];
  edges: PlacedEdge[];
  width: number;
  height: number;
}

export const stageBoxId = (name: string) => `stage:${name}`;
