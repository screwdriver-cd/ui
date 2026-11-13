import type { ELK, ElkExtendedEdge, ElkNode } from 'elkjs/lib/elk-api';
import { layoutKey } from './input';
import {
  stageBoxId,
  type LayoutInput,
  type LayoutNodeInput,
  type LayoutResult,
  type PlacedEdge,
  type PlacedNode,
  type PlacedStage
} from './types';

const GRAPH_OPTIONS = {
  'elk.algorithm': 'layered',
  'elk.direction': 'RIGHT',
  'elk.edgeRouting': 'ORTHOGONAL',
  'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
  'elk.layered.cycleBreaking.strategy': 'GREEDY',
  'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
  'elk.layered.crossingMinimization.forceNodeModelOrder': 'true',
  'elk.layered.spacing.nodeNodeBetweenLayers': '56',
  'elk.layered.spacing.edgeNodeBetweenLayers': '20',
  'elk.spacing.nodeNode': '20',
  'elk.spacing.edgeNode': '16',
  'elk.spacing.edgeEdge': '10',
  'elk.spacing.componentComponent': '36',
  'elk.separateConnectedComponents': 'true',
  'elk.randomSeed': '1'
};

const COMPACT_OPTIONS = {
  ...GRAPH_OPTIONS,
  'elk.layered.spacing.nodeNodeBetweenLayers': '14',
  'elk.layered.spacing.edgeNodeBetweenLayers': '6',
  'elk.spacing.nodeNode': '6',
  'elk.spacing.edgeNode': '4',
  'elk.spacing.edgeEdge': '3',
  'elk.spacing.componentComponent': '10'
};

/**
 * Nodes of one layer share their LEFT edge. ELK reads `elk.alignment` per node (it is not inherited
 * from the graph), so it is set on every job, trigger and stage box.
 */
const LEFT_ALIGN = { 'elk.alignment': 'LEFT' };

/**
 * Ember stacks root rows as ~pr, ~commit, the other triggers (~tag, ~release, ~sd@..., remote
 * requires), then detached jobs and stages (those without an incoming trigger).
 */
export function rootRank(
  node: { id: string; kind?: string } | undefined,
  isRoot: boolean
): number {
  if (!isRoot) return 4;

  const name = node?.id ?? '';

  // Branch variants (~pr:main, ~commit:/regex/) sit directly after the plain trigger they refine.
  if (name === '~pr') return 0;
  if (name.startsWith('~pr:')) return 0.5;
  if (name === '~commit') return 1;
  if (name.startsWith('~commit:')) return 1.5;
  if (node?.kind === 'trigger' || node?.kind === 'external') return 2;

  return 3;
}

export const STAGE_PADDING = { top: 40, left: 16, bottom: 16, right: 16 };
export const COMPACT_STAGE_PADDING = { top: 8, left: 5, bottom: 5, right: 5 };

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

type Point = { x: number; y: number };

/** Moves the start of an edge by `dy`, keeping the route orthogonal. */
function shiftEdgeStart(points: Point[], dy: number, bendX: number): Point[] {
  const [p0, p1, ...rest] = points;

  if (!dy || !p0 || !p1) return points;

  // Not a horizontal first segment: just move the start.
  if (Math.abs(p1.y - p0.y) >= 0.5) {
    return [{ ...p0, y: p0.y + dy }, p1, ...rest];
  }

  // The channel right after the first column is clear: the whole segment can move there.
  if (p1.x <= bendX + 0.5) {
    return [{ ...p0, y: p0.y + dy }, { ...p1, y: p1.y + dy }, ...rest];
  }

  // The segment runs across later layers: leave at the new height, then drop back onto the old route
  // inside the gap after the first column so it never crosses a node.
  const xm = Math.max(bendX, p0.x);

  return [
    { x: p0.x, y: p0.y + dy },
    { x: xm, y: p0.y + dy },
    { x: xm, y: p0.y },
    p1,
    ...rest
  ];
}

/**
 * Where each root trigger should sit so it is level with the middle of the nodes it feeds.
 * Triggers keep their order, never overlap, and stay clear of the first non-trigger below them,
 * so the result is a pure vertical nudge: returns the shift per trigger id (empty when nothing can move).
 */
export function triggerShifts(
  triggers: Array<{ id: string; y: number; height: number; targets: Rect[] }>,
  limitY: number,
  gap: number
): Map<string, number> {
  const shifts = new Map<string, number>();
  const ys = triggers.map(t => {
    const top = Math.min(...t.targets.map(r => r.y));
    const bottom = Math.max(...t.targets.map(r => r.y + r.height));

    return t.targets.length ? (top + bottom) / 2 - t.height / 2 : t.y;
  });

  for (let i = 0; i < ys.length; i++) {
    const prev = triggers[i - 1];

    ys[i] = Math.max(
      ys[i] as number,
      prev ? (ys[i - 1] as number) + prev.height + gap : 0
    );
  }
  for (let i = ys.length - 1; i >= 0; i--) {
    const t = triggers[i] as { height: number };
    const next = triggers[i + 1];
    const max = next
      ? (ys[i + 1] as number) - gap - t.height
      : limitY - t.height;

    ys[i] = Math.min(ys[i] as number, max);
  }

  // The original positions were valid, so a result that breaks the order means "leave them".
  const ok = ys.every(
    (y, i) =>
      y >= 0 &&
      (i === 0 ||
        y >=
          (ys[i - 1] as number) +
            (triggers[i - 1] as { height: number }).height +
            gap -
            0.5)
  );

  if (ok) triggers.forEach((t, i) => shifts.set(t.id, (ys[i] as number) - t.y));

  return shifts;
}

const toElkChildren = (
  nodes: Array<{ id: string; width: number; height: number }>
): ElkNode[] =>
  nodes.map(n => ({
    id: n.id,
    width: n.width,
    height: n.height,
    layoutOptions: LEFT_ALIGN
  }));

const dedupe = (edges: Array<{ id: string; src: string; dest: string }>) => {
  const seen = new Set<string>();

  return edges.filter(e => {
    const k = `${e.src}\u0000${e.dest}`;

    if (e.src === e.dest || seen.has(k)) return false;
    seen.add(k);

    return true;
  });
};

const toElkEdges = (
  edges: Array<{ src: string; dest: string }>
): ElkExtendedEdge[] =>
  edges.map((e, i) => ({ id: `e${i}`, sources: [e.src], targets: [e.dest] }));

function pointsOf(edge: ElkExtendedEdge, dx: number, dy: number) {
  const pts: Array<{ x: number; y: number }> = [];

  (edge.sections ?? []).forEach(s => {
    pts.push(s.startPoint, ...(s.bendPoints ?? []), s.endPoint);
  });

  return pts.map(p => ({ x: p.x + dx, y: p.y + dy }));
}

/**
 * Hierarchical layered layout in one ELK pass (`INCLUDE_CHILDREN`): expanded
 * stages are compound nodes, so ELK sizes and places the stage box around its
 * jobs. Edges inside a stage live in the stage; edges crossing a stage
 * boundary attach to the stage box (hidden inner endpoints are replaced), so
 * the stage reads as one box in the flow.
 */
export async function runLayout(
  input: LayoutInput,
  key: string = layoutKey(input),
  elk: ELK
): Promise<LayoutResult> {
  const compact = !!input.compact;
  const pad = compact ? COMPACT_STAGE_PADDING : STAGE_PADDING;
  const byId = new Map<string, LayoutNodeInput>(
    input.nodes.map(n => [n.id, n])
  );
  const stageOfNode = new Map<string, string>();

  input.stages.forEach(s =>
    s.jobIds.forEach(id => stageOfNode.set(id, s.name))
  );

  const resolved = input.edges
    .filter(e => byId.has(e.src) && byId.has(e.dest))
    .map(e => {
      const ss = stageOfNode.get(e.src);
      const ds = stageOfNode.get(e.dest);
      const cross = ss !== ds;

      return {
        ...e,
        inside: !cross && ss !== undefined,
        ls: cross && ss ? stageBoxId(ss) : e.src,
        ld: cross && ds ? stageBoxId(ds) : e.dest
      };
    });

  // Keep the original order of first appearance so ELK's model order is the API order.
  const order = new Map<string, number>();

  input.nodes.forEach((n, i) => {
    const id = stageOfNode.has(n.id)
      ? stageBoxId(stageOfNode.get(n.id) as string)
      : n.id;

    if (!order.has(id)) order.set(id, i);
  });

  const inStageEdges = new Map<
    string,
    Array<{ id: string; src: string; dest: string }>
  >();

  input.stages.forEach(s =>
    inStageEdges.set(
      s.name,
      dedupe(
        resolved
          .filter(e => e.inside && stageOfNode.get(e.src) === s.name)
          .map(e => ({ id: e.id, src: e.src, dest: e.dest }))
      )
    )
  );

  const stageNodes: ElkNode[] = input.stages.map(s => ({
    id: stageBoxId(s.name),
    layoutOptions: {
      ...LEFT_ALIGN,
      'elk.padding': `[top=${pad.top},left=${pad.left},bottom=${pad.bottom},right=${pad.right}]`
    },
    children: toElkChildren(
      s.jobIds.map(id => byId.get(id) as LayoutNodeInput)
    ),
    // ELK needs ids unique across the hierarchy
    edges: toElkEdges(inStageEdges.get(s.name) ?? []).map(e => ({
      ...e,
      id: `${s.name}\u0000${e.id}`
    }))
  }));

  const hasIncoming = new Set(
    resolved.filter(e => !e.inside && e.ls !== e.ld).map(e => e.ld)
  );
  const rank = (id: string) => rootRank(byId.get(id), !hasIncoming.has(id));

  // Roots share the first layer so their vertical order is comparable (Ember lists them in one column).
  const withRootLayer = (child: ElkNode): ElkNode =>
    hasIncoming.has(child.id)
      ? child
      : {
          ...child,
          layoutOptions: {
            ...child.layoutOptions,
            'elk.layered.layering.layerConstraint': 'FIRST'
          }
        };

  const topChildren: ElkNode[] = [
    ...input.nodes
      .filter(n => !stageOfNode.has(n.id))
      .map(n => ({
        id: n.id,
        width: n.width,
        height: n.height,
        layoutOptions: LEFT_ALIGN
      })),
    ...stageNodes
  ]
    .map(withRootLayer)
    .sort(
      (a, b) =>
        rank(a.id) - rank(b.id) ||
        (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)
    );

  // ELK is told to keep this order, so non-roots follow the order they are reached from the sorted
  // roots (breadth first, edges in API order) rather than the raw API order, which keeps siblings together.
  const next = new Map<string, string[]>();

  resolved
    .filter(e => !e.inside && e.ls !== e.ld)
    .forEach(e => next.set(e.ls, [...(next.get(e.ls) ?? []), e.ld]));

  const reached = new Map<string, number>();
  const queue = topChildren.filter(c => !hasIncoming.has(c.id)).map(c => c.id);

  queue.forEach(id => reached.set(id, reached.size));
  for (let i = 0; i < queue.length; i++) {
    (next.get(queue[i] as string) ?? []).forEach(id => {
      if (!reached.has(id)) {
        reached.set(id, reached.size);
        queue.push(id);
      }
    });
  }
  topChildren.sort(
    (a, b) =>
      rank(a.id) - rank(b.id) ||
      (reached.get(a.id) ?? order.get(a.id) ?? 0) -
        (reached.get(b.id) ?? order.get(b.id) ?? 0)
  );

  const topEdges = dedupe(
    resolved
      .filter(e => !e.inside)
      .map(e => ({ id: e.id, src: e.ls, dest: e.ld }))
  );
  const root = await elk.layout({
    id: 'root',
    layoutOptions: {
      ...(compact ? COMPACT_OPTIONS : GRAPH_OPTIONS),
      'elk.hierarchyHandling': 'INCLUDE_CHILDREN'
    },
    children: topChildren,
    edges: toElkEdges(topEdges).map(e => ({ ...e, id: `top${e.id}` }))
  });

  const rects = new Map<string, Rect>();
  const parentOf = new Map<string, string>();
  const topPoints = new Map<string, Array<{ x: number; y: number }>>();
  const innerPoints = new Map<string, Array<{ x: number; y: number }>>();

  (root.children ?? []).forEach(c => {
    const box: Rect = {
      x: c.x ?? 0,
      y: c.y ?? 0,
      width: c.width ?? 0,
      height: c.height ?? 0
    };

    rects.set(c.id, box);
    (c.children ?? []).forEach(k => {
      rects.set(k.id, {
        x: box.x + (k.x ?? 0),
        y: box.y + (k.y ?? 0),
        width: k.width ?? 0,
        height: k.height ?? 0
      });
      parentOf.set(k.id, c.id);
    });

    const stageName =
      c.id.startsWith('stage:') &&
      input.stages.some(s => stageBoxId(s.name) === c.id)
        ? c.id.slice('stage:'.length)
        : undefined;

    if (stageName) {
      const list = inStageEdges.get(stageName) ?? [];

      ((c.edges ?? []) as ElkExtendedEdge[]).forEach((e, i) =>
        innerPoints.set(
          `${list[i]?.src}\u0000${list[i]?.dest}`,
          pointsOf(e, box.x, box.y)
        )
      );
    }
  });
  ((root.edges ?? []) as ElkExtendedEdge[]).forEach((e, i) =>
    topPoints.set(
      `${topEdges[i]?.src}\u0000${topEdges[i]?.dest}`,
      pointsOf(e, 0, 0)
    )
  );

  // Level each root trigger with the middle of the nodes it feeds (ELK parks fan-out triggers off-centre).
  const gap = compact ? 6 : 20;
  const triggerIds = topChildren
    .filter(c => !hasIncoming.has(c.id) && rank(c.id) < 3 && !c.children)
    .map(c => c.id);
  const triggerSet = new Set(triggerIds);
  const targetsOf = new Map<string, Rect[]>();

  resolved
    .filter(e => !e.inside && e.ls !== e.ld && triggerSet.has(e.ls))
    .forEach(e => {
      const r = rects.get(e.ld);

      if (r) targetsOf.set(e.ls, [...(targetsOf.get(e.ls) ?? []), r]);
    });

  const firstX = Math.min(...triggerIds.map(id => (rects.get(id) as Rect).x));
  const below = topChildren
    .filter(c => !triggerSet.has(c.id) && !hasIncoming.has(c.id))
    .map(c => rects.get(c.id) as Rect)
    .filter(r => r && Math.abs(r.x - firstX) < 1);
  const shifts = triggerShifts(
    triggerIds
      .map(id => ({ id, ...(rects.get(id) as Rect) }))
      .sort((a, b) => a.y - b.y)
      .map(r => ({
        id: r.id,
        y: r.y,
        height: r.height,
        // Only fan-out triggers are centred; a single edge keeps the lane ELK routed for it.
        targets:
          (targetsOf.get(r.id)?.length ?? 0) >= 2
            ? targetsOf.get(r.id) ?? []
            : []
      })),
    below.length ? Math.min(...below.map(r => r.y)) - gap : Infinity,
    gap
  );

  const bendX =
    Math.max(
      ...[...rects.values()]
        .filter(r => Math.abs(r.x - firstX) < 1)
        .map(r => r.x + r.width)
    ) + (compact ? 7 : 28);

  shifts.forEach((dy, id) => {
    const r = rects.get(id) as Rect;

    rects.set(id, { ...r, y: r.y + dy });
    topPoints.forEach((pts, key) => {
      if (key.startsWith(`${id}\u0000`))
        topPoints.set(key, shiftEdgeStart(pts, dy, bendX));
    });
  });

  const placedNodes: PlacedNode[] = input.nodes.map(n => {
    const r = rects.get(n.id) as Rect;
    const parent = parentOf.get(n.id);

    return { id: n.id, ...r, ...(parent ? { parentId: parent } : {}) };
  });
  const placedStages: PlacedStage[] = input.stages.map(s => ({
    id: stageBoxId(s.name),
    name: s.name,
    ...(rects.get(stageBoxId(s.name)) as Rect)
  }));

  const placedEdges: PlacedEdge[] = resolved.map(e => {
    const s = rects.get(e.ls) as Rect;
    const d = rects.get(e.ld) as Rect;
    const points = e.inside
      ? innerPoints.get(`${e.src}\u0000${e.dest}`) ?? []
      : topPoints.get(`${e.ls}\u0000${e.ld}`) ?? [];

    return {
      id: e.id,
      src: e.src,
      dest: e.dest,
      layoutSrc: e.ls,
      layoutDest: e.ld,
      points,
      hidden: !!e.hidden,
      backward: d.x < s.x + s.width - 0.5
    };
  });

  const all = [...rects.values()];

  return {
    key,
    nodes: placedNodes,
    stages: placedStages,
    edges: placedEdges,
    width: Math.max(0, ...all.map(r => r.x + r.width)),
    height: Math.max(0, ...all.map(r => r.y + r.height))
  };
}
