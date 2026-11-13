import type { FlowState } from '../lens';
import type { WorkflowModel } from '../model/model';
import type { LayoutResult } from '../layout/types';

/** Labels are 13px: below this zoom they render under ~10px and stop being readable. */
export const LEGIBLE_ZOOM = 0.8;
/** Space kept between the graph's edge and the pane when the viewport is clamped. */
const EDGE_MARGIN = 24;

export interface FocusInput {
  model: WorkflowModel;
  states: ReadonlyMap<string, FlowState>;
  /** event.startFrom: `~commit`, `~pr`, `~commit:branch`, a job name or `PR-1:job`. */
  start?: string;
  /** Nodes decorate marked STARTED_FROM (trigger names that matched `start`). */
  startedFrom?: readonly string[];
  /** x of each placed node, the tie-break between equally deep candidates. */
  xOf?: (name: string) => number | undefined;
}

const roots = (model: WorkflowModel) =>
  model.filterNodes(n => model.inDegree(n) === 0);

/** Where the event started: the STARTED_FROM trigger, the restarted job, or the first root. */
export function startNodes({
  model,
  start,
  startedFrom = []
}: FocusInput): string[] {
  const marked = startedFrom.filter(n => model.hasNode(n));

  if (marked.length) return marked;

  if (start) {
    const name = /^PR-[0-9]+:/.test(start)
      ? start.slice(start.indexOf(':') + 1)
      : start;

    if (model.hasNode(name)) return [name];
  }

  const r = roots(model);

  return r.length ? [r[0] as string] : model.nodes().slice(0, 1);
}

/** Hop distance from the start nodes (BFS, so cycles are fine). Unreached nodes are absent. */
function depths(model: WorkflowModel, from: string[]): Map<string, number> {
  const depth = new Map(from.map(n => [n, 0]));
  const queue = [...from];

  for (let i = 0; i < queue.length; i++) {
    const cur = queue[i] as string;

    model.forEachOutNeighbor(cur, next => {
      if (!depth.has(next)) {
        depth.set(next, (depth.get(cur) ?? 0) + 1);
        queue.push(next);
      }
    });
  }

  return depth;
}

/**
 * The node the graph first centres on: the deepest running build, else the deepest queued/blocked
 * one, else (a finished event) where the event started.
 */
export function pickFocus(input: FocusInput): string | null {
  const { model, states, xOf } = input;

  if (!model.order) return null;

  const from = startNodes(input);
  const depth = depths(model, from);
  const deepest = (state: FlowState) => {
    const candidates = model.filterNodes(n => states.get(n) === state);

    candidates.sort(
      (a, b) =>
        (depth.get(b) ?? -1) - (depth.get(a) ?? -1) ||
        (xOf?.(b) ?? 0) - (xOf?.(a) ?? 0) ||
        a.localeCompare(b)
    );

    return candidates[0];
  };

  return deepest('running') ?? deepest('queued') ?? from[0] ?? null;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function layoutBounds(
  layout: Pick<LayoutResult, 'nodes' | 'stages'>
): Rect {
  const all: Rect[] = [...layout.nodes, ...layout.stages];

  if (!all.length) return { x: 0, y: 0, width: 0, height: 0 };

  const minX = Math.min(...all.map(r => r.x));
  const minY = Math.min(...all.map(r => r.y));
  const maxX = Math.max(...all.map(r => r.x + r.width));
  const maxY = Math.max(...all.map(r => r.y + r.height));

  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

/** Zoom at which the whole graph fits the pane with `padding` (a fraction of the pane) around it. */
export function fitZoom(
  bounds: Rect,
  pane: { width: number; height: number },
  padding: number
): number {
  if (!bounds.width || !bounds.height) return Infinity;

  return Math.min(
    (pane.width * (1 - 2 * padding)) / bounds.width,
    (pane.height * (1 - 2 * padding)) / bounds.height
  );
}

/**
 * Viewport at `zoom` centred on `focus`, then shifted (never re-zoomed) so the graph's edges do not
 * pull away from the pane's: centring on a left-hand trigger must not leave half the pane empty.
 * An axis on which the graph is smaller than the pane is centred instead.
 */
export function focusViewport(
  bounds: Rect,
  focus: Rect,
  pane: { width: number; height: number },
  zoom: number
): { x: number; y: number; zoom: number } {
  const axis = (
    start: number,
    size: number,
    focusMid: number,
    paneSize: number
  ) => {
    const span = size * zoom;

    if (span + 2 * EDGE_MARGIN <= paneSize)
      return (paneSize - span) / 2 - start * zoom;

    const centred = paneSize / 2 - focusMid * zoom;
    const lo = paneSize - EDGE_MARGIN - (start + size) * zoom;
    const hi = EDGE_MARGIN - start * zoom;

    return Math.min(hi, Math.max(lo, centred));
  };

  return {
    x: axis(bounds.x, bounds.width, focus.x + focus.width / 2, pane.width),
    y: axis(bounds.y, bounds.height, focus.y + focus.height / 2, pane.height),
    zoom
  };
}
