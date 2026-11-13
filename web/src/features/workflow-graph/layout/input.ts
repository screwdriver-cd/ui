import type { DecoratedGraph } from '../decorate/decorate';
import { nodeKind } from '../decorate/eligibility';
import { computeJoins } from '../decorate/joins';
import type { TextMeasurer } from './measure';
import type { LayoutInput, LayoutNodeInput, LayoutNodeKind } from './types';

export const NODE_HEIGHT = 44;
export const TRIGGER_HEIGHT = 32;
const MIN_WIDTH = 112;
const MAX_WIDTH = 280;
const ICON_AND_PADDING = 56;

export interface LayoutInputOptions {
  measure: TextMeasurer;
  /** false: icon-only nodes. Part of the layout key since it changes sizes. */
  showLabels?: boolean;
  /** Thumbnail layout (mini variant): labels are off and nodes are small. */
  compact?: boolean;
}

export const labelOf = (n: {
  name: string;
  displayName?: string | number;
}): string =>
  n.displayName !== undefined && n.displayName !== ''
    ? String(n.displayName)
    : n.name;

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

export const COMPACT_SIZE = 18;
export const COMPACT_TRIGGER_SIZE = 10;

/** Room for the AND ("AND 2/3") and OR join badges next to the label. */
const JOIN_BADGE_WIDTH = { AND: 64, OR: 40 };

function sizeOf(
  kind: LayoutNodeKind,
  label: string,
  { measure, showLabels = true, compact = false }: LayoutInputOptions,
  join?: 'AND' | 'OR'
) {
  if (compact) {
    return kind === 'trigger'
      ? { width: COMPACT_TRIGGER_SIZE, height: COMPACT_TRIGGER_SIZE }
      : { width: COMPACT_SIZE, height: COMPACT_SIZE };
  }

  if (kind === 'downstream') return { width: 150, height: 36 };

  if (!showLabels) {
    // The square keeps room for a join badge beside the icon, as the labelled size does.
    return kind === 'trigger'
      ? { width: 32, height: TRIGGER_HEIGHT }
      : {
          width: NODE_HEIGHT + (join ? JOIN_BADGE_WIDTH[join] : 0),
          height: NODE_HEIGHT
        };
  }

  if (kind === 'trigger') {
    return {
      width: clamp(measure(label) + 32, 80, MAX_WIDTH),
      height: TRIGGER_HEIGHT
    };
  }

  const badge = join ? JOIN_BADGE_WIDTH[join] : 0;

  return {
    width: clamp(
      measure(label) + ICON_AND_PADDING + badge,
      MIN_WIDTH,
      MAX_WIDTH + badge
    ),
    height: NODE_HEIGHT
  };
}

/**
 * Reduces a decorated graph to what layout depends on. Status, build ids and
 * every other styling-only attribute are intentionally dropped so polling
 * never changes the layout key.
 */
export function toLayoutInput(
  graph: DecoratedGraph,
  options: LayoutInputOptions
): LayoutInput {
  const expanded = new Set(
    graph.stages.filter(s => !s.isCollapsed).map(s => s.name)
  );
  const names = new Set(graph.nodes.map(n => n.name));

  const joins = computeJoins(
    graph.edges.filter(
      e => names.has(e.src) && names.has(e.dest) && e.src !== e.dest
    )
  );

  const nodes: LayoutNodeInput[] = graph.nodes.map(n => {
    const kind = nodeKind(n) as LayoutNodeKind;
    const stage =
      n.stageName && expanded.has(n.stageName) && n.type !== 'JOB_GROUP'
        ? n.stageName
        : undefined;

    return {
      id: n.name,
      kind,
      ...sizeOf(kind, labelOf(n), options, joins.get(n.name)?.kind),
      ...(stage ? { stage } : {})
    };
  });

  const edges = graph.edges
    .filter(e => names.has(e.src) && names.has(e.dest) && e.src !== e.dest)
    .map(e => ({
      id: `${e.src}->${e.dest}`,
      src: e.src,
      dest: e.dest,
      ...(e.hidden ? { hidden: true } : {})
    }));

  const stages = graph.stages
    .filter(s => expanded.has(s.name))
    .map(s => ({
      name: s.name,
      jobIds: nodes.filter(n => n.stage === s.name).map(n => n.id)
    }))
    .filter(s => s.jobIds.length > 0);

  return {
    nodes,
    edges,
    stages,
    ...(options.compact ? { compact: true } : {})
  };
}

function hash(str: string): string {
  let h = 5381;

  for (let i = 0; i < str.length; i += 1) {
    h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  }

  return (h >>> 0).toString(36);
}

/** Stable key over structure + collapsed state (collapsed stages are already nodes) + sizes. */
export function layoutKey(input: LayoutInput): string {
  const s = JSON.stringify([
    input.nodes.map(n => [n.id, n.kind, n.width, n.height, n.stage ?? '']),
    input.edges.map(e => [e.src, e.dest, e.hidden ? 1 : 0]),
    input.stages.map(st => st.name),
    input.compact ? 1 : 0
  ]);

  return `${input.nodes.length}:${input.edges.length}:${hash(s)}:${s.length}`;
}
