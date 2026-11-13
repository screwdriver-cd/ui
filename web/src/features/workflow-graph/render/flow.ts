import { MarkerType, type Edge, type Node } from '@xyflow/react';
import type { DecoratedGraph, DecoratedNode } from '../decorate/decorate';
import {
  canJobStart,
  canStageStart,
  nodeKind,
  type ActiveTab,
  type NodeKind
} from '../decorate/eligibility';
import { computeJoins, type JoinInfo } from '../decorate/joins';
import { labelOf } from '../layout/input';
import { stageBoxId, type LayoutResult } from '../layout/types';
import type { Lens, LensContext, LensTier, FlowState } from '../lens';
import type { WorkflowGraphData } from '../types';
import type { WorkflowNodeInfo, WorkflowStageInfo } from './types';

const ACTIVE = new Set(['QUEUED', 'RUNNING', 'BLOCKED']);
/** Ember: "Stop frozen build" aborts the FROZEN build (`PUT /builds/:id {status: 'ABORTED'}`). */
const FROZEN = 'FROZEN';

export interface FlowNodeData extends Record<string, unknown> {
  kind: NodeKind | 'stage';
  name: string;
  label: string;
  status?: string;
  tier: LensTier | null;
  dim: boolean;
  matched: boolean;
  join?: { kind: 'AND' | 'OR'; satisfied: number; total: number };
  info?: WorkflowNodeInfo;
  stage?: WorkflowStageInfo & { collapsed: boolean };
  downstreamCount?: number;
  externalId?: string;
  showLabels: boolean;
  active: boolean;
  pinned: boolean;
}

export interface FlowEdgeData extends Record<string, unknown> {
  status?: string;
  tier: LensTier | null;
  join: 'AND' | 'OR' | null;
  backward: boolean;
  /** ELK route (absolute coordinates); empty when the layout has none. */
  points: Array<{ x: number; y: number }>;
}

export type FlowNode = Node<FlowNodeData>;
export type FlowEdge = Edge<FlowEdgeData>;

export interface BuildFlowArgs {
  decorated: DecoratedGraph;
  /** Graph used for start eligibility (the raw workflow graph). */
  graph: WorkflowGraphData;
  layout: LayoutResult;
  lensCtx: LensContext;
  lens: Lens | null;
  pinned: string | null;
  activeTab: ActiveTab;
  readOnly: boolean;
  showLabels: boolean;
  /** Thumbnail: small arrowheads, thin edges. */
  mini?: boolean;
  matches: ReadonlySet<string> | null;
  stateFilter: FlowState | null;
  stateFilterNodes: ReadonlySet<string>;
}

export function nodeInfo(
  n: DecoratedNode,
  graph: WorkflowGraphData,
  activeTab: ActiveTab,
  readOnly: boolean
): WorkflowNodeInfo {
  const active = !!n.status && ACTIVE.has(n.status);
  // CREATED: a build waiting for its join inputs. It cannot be restarted, and as in Ember it offers
  // no Stop either: PUT /builds/:id refuses a CREATED build (403); stopping the event aborts it.
  const waiting = n.status === 'CREATED';
  const startable =
    !readOnly &&
    !n.isDisabled &&
    !n.manualStartDisabled &&
    n.status !== 'DISABLED' &&
    canJobStart(activeTab, graph, n.name) &&
    nodeKind(n) === 'job';

  return {
    name: n.name,
    displayName:
      n.displayName === undefined ? undefined : String(n.displayName),
    jobId: n.id,
    buildId: n.buildId,
    status: n.status,
    stageName: n.stageName,
    description: n.description,
    isDisabled: n.isDisabled,
    stateChanger: n.stateChanger,
    // The API stores ' ' when no reason was given (Ember hides it).
    stateChangeMessage: n.stateChangeMessage?.trim() || undefined,
    manualStartDisabled: n.manualStartDisabled,
    canStart: startable && !active && !waiting,
    canStop:
      !readOnly && (active || n.status === FROZEN) && n.buildId !== undefined,
    canToggle: !readOnly && n.id !== undefined && nodeKind(n) === 'job'
  };
}

const TIER_PRIORITY: LensTier[] = [
  'focus',
  'upstream-taken',
  'downstream',
  'upstream-possible',
  'dimmed'
];

/** Composes React Flow nodes/edges from decoration + layout + lens. Pure. */
export function buildFlow(a: BuildFlowArgs): {
  nodes: FlowNode[];
  edges: FlowEdge[];
} {
  const { decorated, layout, lens } = a;
  const byName = new Map(decorated.nodes.map(n => [n.name, n]));
  const joins = computeJoins(
    decorated.edges.filter(e => byName.has(e.src) && byName.has(e.dest))
  );
  const placed = new Map(layout.nodes.map(p => [p.id, p]));
  const stageBox = new Map(layout.stages.map(s => [s.id, s]));
  const lensOn = lens !== null;
  const filtering = a.matches !== null || a.stateFilter !== null;

  const isDim = (name: string, tier: LensTier | null): boolean => {
    if (lensOn && tier === 'dimmed') return true;
    if (a.matches && !a.matches.has(name)) return true;
    if (a.stateFilter && !a.stateFilterNodes.has(name)) return true;

    return false;
  };

  const joinOf = (name: string): FlowNodeData['join'] => {
    const j: JoinInfo | undefined = joins.get(name);

    if (!j) return undefined;

    return {
      kind: j.kind,
      total: j.inputs.length,
      satisfied:
        j.kind === 'AND'
          ? j.inputs.filter(i => a.lensCtx.states.get(i) === 'done').length
          : 0
    };
  };

  const stageNodes: FlowNode[] = decorated.stages
    .filter(s => stageBox.has(stageBoxId(s.name)))
    .map(s => {
      const box = stageBox.get(stageBoxId(s.name)) as NonNullable<
        ReturnType<typeof stageBox.get>
      >;
      const kids = layout.nodes
        .filter(p => p.parentId === box.id)
        .map(p => p.id);
      const tier: LensTier | null = lensOn
        ? kids.some(k => lens?.tierOf(k) !== 'dimmed')
          ? 'downstream'
          : 'dimmed'
        : null;
      const dim =
        (lensOn && tier === 'dimmed') ||
        (filtering && !kids.some(k => !isDim(k, lens?.tierOf(k) ?? null)));

      return {
        id: box.id,
        type: 'stage',
        position: { x: box.x, y: box.y },
        width: box.width,
        height: box.height,
        style: { width: box.width, height: box.height },
        zIndex: 0,
        draggable: false,
        selectable: false,
        data: {
          kind: 'stage',
          name: s.name,
          label: s.name,
          status: s.status,
          tier,
          dim,
          matched: false,
          showLabels: a.showLabels,
          active: false,
          pinned: false,
          stage: {
            name: s.name,
            id: s.id,
            stageBuildId: s.stageBuildId,
            status: s.status,
            collapsed: false,
            manualStartDisabled: s.manualStartDisabled,
            readOnly: a.readOnly,
            canStart:
              !a.readOnly &&
              !s.manualStartDisabled &&
              canStageStart(a.activeTab, a.graph, s)
          }
        }
      } satisfies FlowNode;
    });

  const jobNodes: FlowNode[] = [];

  decorated.nodes.forEach(n => {
    const p = placed.get(n.name);

    if (!p) return;

    const kind = nodeKind(n);
    const tier = lens ? lens.tierOf(n.name) : null;
    const parent = p.parentId ? stageBox.get(p.parentId) : undefined;
    const collapsedStage =
      n.type === 'JOB_GROUP'
        ? decorated.stages.find(s => s.name === n.stageName)
        : undefined;
    const ext = n.name.match(/^~?sd@(\d+):(.+)$/);
    const data: FlowNodeData = {
      kind,
      name: n.name,
      label: labelOf(n),
      status: n.status,
      tier,
      dim: isDim(n.name, tier),
      matched: !!a.matches?.has(n.name),
      join: joinOf(n.name),
      showLabels: a.showLabels,
      active: n.status === 'RUNNING' || n.status === 'BLOCKED',
      pinned: a.pinned === n.name,
      info:
        kind === 'job' || kind === 'external'
          ? nodeInfo(n, a.graph, a.activeTab, a.readOnly)
          : undefined,
      downstreamCount: n.triggers?.length,
      externalId: ext?.[1]
    };

    if (collapsedStage) {
      data.stage = {
        name: collapsedStage.name,
        id: collapsedStage.id,
        stageBuildId: collapsedStage.stageBuildId,
        status: collapsedStage.status,
        collapsed: true,
        manualStartDisabled: collapsedStage.manualStartDisabled,
        readOnly: a.readOnly,
        canStart:
          !a.readOnly &&
          !collapsedStage.manualStartDisabled &&
          canStageStart(a.activeTab, a.graph, collapsedStage)
      };
    }

    jobNodes.push({
      id: n.name,
      type: kind === 'stage-group' ? 'jobGroup' : kind,
      position: parent
        ? { x: p.x - parent.x, y: p.y - parent.y }
        : { x: p.x, y: p.y },
      width: p.width,
      height: p.height,
      ...(parent ? { parentId: parent.id, extent: 'parent' as const } : {}),
      zIndex: 1,
      draggable: false,
      data
    });
  });

  // Edges. Hidden bypass edges are drawn only when they attach to a stage box.
  const groups = new Map<
    string,
    { src: string; dest: string; members: typeof layout.edges }
  >();

  const groupNodes = new Set(
    decorated.nodes.filter(n => n.type === 'JOB_GROUP').map(n => n.name)
  );

  layout.edges.forEach(e => {
    const mapped = e.layoutSrc !== e.src || e.layoutDest !== e.dest;

    // A collapsed stage is a plain JOB_GROUP node, so edges into and out of it are not "mapped" to a stage
    // box. Decoration marks them hidden (they only attach stage boxes), but they are the only link there.
    const touchesGroup =
      groupNodes.has(e.layoutSrc) || groupNodes.has(e.layoutDest);

    if (e.hidden && !mapped && !touchesGroup) return;

    const src = e.hidden || mapped ? e.layoutSrc : e.src;
    const dest = e.hidden || mapped ? e.layoutDest : e.dest;
    const key = `${src}->${dest}`;
    const g = groups.get(key);

    if (g) g.members.push(e);
    else groups.set(key, { src, dest, members: [e] });
  });

  const edgeByKey = new Map(
    decorated.edges.map(e => [`${e.src}->${e.dest}`, e])
  );
  const edges: FlowEdge[] = [];

  groups.forEach(({ src, dest, members }, id) => {
    const tiers = lens ? members.map(m => lens.edgeTierOf(m.src, m.dest)) : [];
    const tier: LensTier | null = lens
      ? TIER_PRIORITY.find(t => tiers.includes(t)) ?? 'dimmed'
      : null;
    const first = members[0] as (typeof members)[number];
    const dEdge = edgeByKey.get(first.id);
    const srcStage = decorated.stages.find(s => stageBoxId(s.name) === src);
    const status = srcStage ? srcStage.status : dEdge?.status;
    const destJoin = a.lensCtx.joins.get(
      dest.startsWith('stage:') ? first.dest ?? dest : dest
    );
    const isAnd =
      !!destJoin &&
      destJoin.kind === 'AND' &&
      destJoin.inputs.includes(first.src);
    const backward = members.some(m => m.backward);
    const dim =
      (lensOn && tier === 'dimmed') || (filtering && !!edgeDimmed(a, members));

    edges.push({
      id,
      source: src,
      target: dest,
      type: 'elk',
      zIndex: tier && tier !== 'dimmed' ? 3 : 2,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: a.mini ? 6 : 14,
        height: a.mini ? 6 : 14
      },
      className: [
        'wg-edge',
        a.mini ? 'wg-edge--mini' : '',
        status ? `wg-edge--${status}` : '',
        isAnd ? 'wg-edge--and' : destJoin ? 'wg-edge--or' : '',
        backward ? 'wg-edge--back' : '',
        tier ? `wg-tier--${tier}` : '',
        dim ? 'wg-dim' : ''
      ]
        .filter(Boolean)
        .join(' '),
      data: {
        status,
        tier,
        join: destJoin ? (isAnd ? 'AND' : 'OR') : null,
        backward,
        points: first.points
      }
    });
  });

  return { nodes: [...stageNodes, ...jobNodes], edges };
}

function edgeDimmed(
  a: BuildFlowArgs,
  members: Array<{ src: string; dest: string }>
): boolean {
  const ok = (n: string) =>
    !(a.matches && !a.matches.has(n)) &&
    !(a.stateFilter && !a.stateFilterNodes.has(n));

  return !members.some(m => ok(m.src) && ok(m.dest));
}
