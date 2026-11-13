/**
 * Runs the Ember `app/utils/graph-tools.js` layout (grid positions) so the new
 * ELK layout can be compared to it. The module's only Ember imports
 * (`@ember/object`, `ember-data`) are stubbed by the test via vi.mock.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { WorkflowGraphData } from '../types';
import type { Polyline } from '../layout/crossings';

type LegacyDecorate = (args: Record<string, unknown>) => unknown;

function load(): LegacyDecorate {
  const legacySource = readFileSync(resolve(process.cwd(), '../app/utils/graph-tools.js'), 'utf8');
  const body = legacySource
    .replace(/^import .*$/gm, '')
    .replace(/export\s*\{[\s\S]*?\};?\s*$/m, '');
  const get = (o: unknown, path: string) => path.split('.').reduce<any>((acc, k) => acc?.[k], o);
  const DS = { PromiseArray: class {}, PromiseManyArray: class {} };

  // eslint-disable-next-line no-new-func
  return new Function('get', 'DS', `${body}\nreturn decorateGraph;`)(get, DS) as LegacyDecorate;
}

const legacyDecorate = load();

interface LegacyPos {
  x: number;
  y: number;
}

interface LegacyResult {
  nodes: Array<{ name: string; displayName?: string; pos: LegacyPos }>;
  edges: Array<{ src: string; dest: string; from?: LegacyPos; to?: LegacyPos; hidden?: boolean }>;
  stageEdges: Array<{ src: string; dest: string; from?: { pos?: LegacyPos }; to?: { pos?: LegacyPos } }>;
  stages: Array<{ name: string; pos?: LegacyPos; graph: { meta: { width: number; height: number } } }>;
}

export interface LegacyLayout {
  /** Straight segments between grid cells (column, row), as the d3 renderer draws them. */
  polylines: Polyline[];
  columns: number;
  rows: number;
  /** Estimated canvas px, using the legacy sizes (ICON 36, node width max(72, 7 * name length)). */
  width: number;
  height: number;
  nodeCount: number;
}

const ICON_SIZE = 36;

export function legacyLayout(
  graph: WorkflowGraphData,
  opts: { stages?: unknown[]; collapsedStages?: Set<string> } = {}
): LegacyLayout {
  const g = legacyDecorate({
    inputGraph: graph,
    stages: opts.stages,
    collapsedStages: opts.collapsedStages ?? new Set<string>(),
    start: undefined
  }) as LegacyResult;
  const pos = new Map<string, LegacyPos>();

  g.nodes.forEach(n => pos.set(n.name, n.pos));

  const polylines: Polyline[] = [];

  g.edges.forEach(e => {
    if (e.hidden || !e.from || !e.to) return;
    polylines.push({ src: e.src, dest: e.dest, points: [e.from, e.to] });
  });

  const cols = Math.max(0, ...g.nodes.map(n => n.pos.x)) + 1;
  const rows = Math.max(0, ...g.nodes.map(n => n.pos.y)) + 1;
  const longest = Math.max(0, ...g.nodes.map(n => String(n.displayName ?? n.name).length));
  const nodeWidth = Math.max(ICON_SIZE * 2, Math.min(longest, 20) * 7);

  return { polylines, columns: cols, rows, width: cols * nodeWidth, height: rows * ICON_SIZE * 2, nodeCount: g.nodes.length };
}
