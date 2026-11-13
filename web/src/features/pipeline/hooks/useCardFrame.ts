import { useMemo } from 'react';
import { decorateGraph } from '~/features/workflow-graph/decorate';
import { nodeKind } from '~/features/workflow-graph/decorate/eligibility';
import { toLayoutInput } from '~/features/workflow-graph/layout/input';
import { createTextMeasurer } from '~/features/workflow-graph/layout/measure';
import type {
  LayoutInput,
  LayoutResult
} from '~/features/workflow-graph/layout/types';
import { useLayout } from '~/features/workflow-graph/render/useLayout';
import type { WorkflowGraphData } from '~/features/workflow-graph/types';
import type { Build } from '../types';

export interface FrameNode {
  name: string;
  /** Job id; absent for triggers and external pipelines. */
  jobId?: number;
  kind: string;
  /** Virtual jobs (such as stage setup/teardown) do no work; the strip leaves them out. */
  virtual: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CardFrame {
  /** Every node, in reading order (left to right, then top to bottom). */
  nodes: FrameNode[];
  edges: Array<{ src: string; dest: string }>;
  /** Every job of the graph, including ones the layout folds away (virtual stage setup/teardown). */
  jobIds: Set<number>;
  width: number;
  height: number;
}

/** What an event did with each frame job. */
export interface FrameStatus {
  /** Newest build status by job id; a job without an entry did not run. */
  byJob: Map<number, string>;
  /** Jobs the event ran that are no longer in the pipeline's graph. */
  removed: number;
}

const measure = createTextMeasurer();
const inputs = new WeakMap<WorkflowGraphData, LayoutInput>();
const EMPTY_INPUT: LayoutInput = {
  nodes: [],
  edges: [],
  stages: [],
  compact: true
};

/** One compact layout per pipeline graph: every card in the rail shares it (and its cached ELK run). */
function layoutInputOf(graph: WorkflowGraphData | undefined): LayoutInput {
  if (!graph) return EMPTY_INPUT;

  let input = inputs.get(graph);

  if (!input) {
    input = toLayoutInput(decorateGraph({ graph }), {
      measure,
      showLabels: false,
      compact: true
    });
    inputs.set(graph, input);
  }

  return input;
}

export function placeFrame(
  graph: WorkflowGraphData,
  layout: LayoutResult
): CardFrame {
  const byName = new Map(graph.nodes.map(n => [n.name, n]));
  const nodes = layout.nodes
    .filter(p => byName.has(p.id))
    .map(p => {
      const node = byName.get(p.id) as WorkflowGraphData['nodes'][number];

      return {
        name: p.id,
        jobId: node.id === undefined ? undefined : Number(node.id),
        kind: nodeKind(node),
        virtual: Boolean(node.virtual),
        x: p.x,
        y: p.y,
        width: p.width,
        height: p.height
      };
    })
    .sort((a, b) => a.x - b.x || a.y - b.y);
  const right = Math.max(0, ...nodes.map(n => n.x + n.width));
  const bottom = Math.max(0, ...nodes.map(n => n.y + n.height));

  return {
    nodes,
    edges: layout.edges
      .filter(e => !e.hidden)
      .map(e => ({ src: e.src, dest: e.dest })),
    jobIds: new Set(
      graph.nodes.filter(n => n.id !== undefined).map(n => Number(n.id))
    ),
    width: right,
    height: bottom
  };
}

/** The pipeline's current graph, laid out once, as the fixed frame every event card draws into. */
export function useCardFrame(
  graph: WorkflowGraphData | undefined
): CardFrame | null {
  const { layout } = useLayout(layoutInputOf(graph));

  return useMemo(
    () =>
      graph && layout && layout.nodes.length ? placeFrame(graph, layout) : null,
    [graph, layout]
  );
}

/**
 * The frame repacked onto a grid: ELK's columns in order, each top to bottom. Tall columns wrap
 * into side-by-side columns, and a long pipeline wraps into bands, like lines of text.
 */
export interface GridFrame {
  /** Position in grid cells; `band` is the line of text the cell sits on. */
  cells: Map<string, { col: number; row: number; band: number }>;
  cols: number;
  /** Height in grid cells, gaps between bands included. */
  rows: number;
}

const grids = new WeakMap<CardFrame, GridFrame>();

/** The card's drawing area (px); rows and bands are picked to make cells as large as it allows. */
const GRID_WIDTH = 288;
const GRID_HEIGHT = 72;
/** Space between bands, in cells. */
export const BAND_GAP = 0.5;
/** Below this cell size (px), a long pipeline wraps into bands. */
const MIN_CELL = 8;

export function packFrame(frame: CardFrame): GridFrame {
  const cached = grids.get(frame);

  if (cached) return cached;

  // Nodes are in reading order, so a node starts a new column once it is clear of the current one.
  const columns: FrameNode[][] = [];
  let left = -Infinity;

  frame.nodes.forEach(n => {
    const last = columns[columns.length - 1];

    if (!last || n.x >= left + n.width / 2) {
      columns.push([n]);
      left = n.x;
    } else last.push(n);
  });

  const tallest = Math.max(1, ...columns.map(c => c.length));
  const colsFor = (rows: number) =>
    columns.reduce((sum, c) => sum + Math.ceil(c.length / rows), 0);
  const heightOf = (rows: number, bands: number) =>
    bands * rows + (bands - 1) * BAND_GAP;
  let rows = 1;
  let bands = 1;
  let best = 0;

  // Bands cost the graph's shape, so they only come in once a single band would leave cells too small.
  const search = (maxBands: (cols: number) => number) => {
    for (let r = 1; r <= tallest; r += 1) {
      const cols = colsFor(r);

      for (let b = 1; b <= maxBands(cols); b += 1) {
        const cell = Math.min(
          GRID_WIDTH / Math.ceil(cols / b),
          GRID_HEIGHT / heightOf(r, b)
        );

        if (cell > best) {
          best = cell;
          rows = r;
          bands = b;
        }
      }
    }
  };

  search(() => 1);
  if (best < MIN_CELL) search(cols => cols);

  const perBand = Math.ceil(colsFor(rows) / bands);
  const cells = new Map<string, { col: number; row: number; band: number }>();
  let col = 0;

  columns.forEach(c => {
    c.forEach((n, i) => {
      const at = col + Math.floor(i / rows);
      const band = Math.floor(at / perBand);

      cells.set(n.name, {
        col: at % perBand,
        row: band * (rows + BAND_GAP) + (i % rows),
        band
      });
    });
    col += Math.ceil(c.length / rows);
  });

  const used = Math.min(rows, tallest);
  const grid = {
    cells,
    cols: Math.min(perBand, col),
    rows: bands === 1 ? used : heightOf(rows, bands)
  };

  grids.set(frame, grid);

  return grid;
}

/** How much room a row or column where nothing ran keeps, next to 1 for one where something ran. */
export const FOCUS_IDLE = 0.15;
/**
 * The most room all of an axis's idle rows (or columns) share, so a long list of jobs that did not
 * run (say 30 detached deploy jobs) cannot crowd out the few that did. The card is about four
 * times wider than tall, so columns get more.
 */
const IDLE_ROWS = 1;
const IDLE_COLUMNS = 2.5;

/**
 * Lays one coordinate axis out by its rows (or columns): each keeps its order, but takes room 1
 * when a node in it ran, and a share of `idleBudget` (at most FOCUS_IDLE) otherwise. Returns each
 * node's centre and its row's room.
 */
function focusAxis(
  nodes: FrameNode[],
  start: (n: FrameNode) => number,
  extent: (n: FrameNode) => number,
  ran: (n: FrameNode) => boolean,
  idleBudget: number
) {
  const groups: FrameNode[][] = [];
  let edge = -Infinity;

  [...nodes]
    .sort((a, b) => start(a) - start(b))
    .forEach(n => {
      // A node joins the current row while it overlaps the row's first node.
      if (start(n) >= edge) {
        groups.push([]);
        edge = start(n) + extent(n) / 2;
      }
      groups[groups.length - 1]?.push(n);
    });

  const busy = groups.map(g => g.some(ran));
  const idleCount = busy.filter(b => !b).length;
  const idle = Math.min(FOCUS_IDLE, idleBudget / Math.max(1, idleCount));
  const at = new Map<string, { center: number; room: number }>();
  let used = 0;

  const rooms = groups.map((g, i) => {
    const room = busy[i] ? 1 : idle;

    g.forEach(n => at.set(n.name, { center: used + room / 2, room }));
    used += room;

    return { nodes: g, room };
  });

  return { at, total: used, groups: rooms };
}

export interface FocusFrame {
  /**
   * Centre and size (the smaller of its row's and column's room) of each node, in cells; `band`
   * is the line a wrapped run sits on.
   */
  cells: Map<string, { x: number; y: number; size: number; band: number }>;
  width: number;
  height: number;
  /** Pixels per cell: the same on every card, unless the run is too large for the card. */
  cell: number;
}

/** Pixels per cell of the focus graph (a job that ran draws at FOCUS_NODE of it). */
export const FOCUS_CELL_PX = 14;
/** A node's share of its cell; the rest is the gap that keeps edges visible between nodes. */
export const FOCUS_NODE = 0.55;
/** Rows a card's graph may take before a run is stacked by column instead (see focusFrame). */
export const FOCUS_MAX_ROWS = 7;
/** The most room the focus graph takes on a card (px), a half-cell margin included. */
const FOCUS_WIDTH_PX = 288;
const FOCUS_HEIGHT_PX = (FOCUS_MAX_ROWS + 1) * FOCUS_CELL_PX;
/** Space between the lines of a wrapped run, in cells. */
const FOCUS_BAND_GAP = 0.5;

const cellFor = (width: number, height: number) =>
  Math.min(
    FOCUS_CELL_PX,
    FOCUS_WIDTH_PX / (width + 1),
    FOCUS_HEIGHT_PX / (height + 1)
  );

/**
 * The frame with rows and columns where nothing ran squeezed, so what ran gets the room, drawn at
 * one cell size on every card.
 *
 * A large run that still needs more than `maxRows` rows (ELK gives most jobs of a big graph a row
 * of their own) is stacked by column instead: each column keeps its place, its jobs stack in their
 * order without the rows of other columns, and a column still too tall wraps into side-by-side
 * columns. That trades the rows' alignment across columns for using the card's width. A run still
 * too wide then wraps into lines, like text.
 */
export function focusFrame(
  frame: CardFrame,
  ran: (n: FrameNode) => boolean,
  maxRows = FOCUS_MAX_ROWS
): FocusFrame {
  const xs = focusAxis(
    frame.nodes,
    n => n.x,
    n => n.width,
    ran,
    IDLE_COLUMNS
  );
  const ys = focusAxis(
    frame.nodes,
    n => n.y,
    n => n.height,
    ran,
    IDLE_ROWS
  );

  if (ys.total <= maxRows) {
    const cells: FocusFrame['cells'] = new Map();

    frame.nodes.forEach(n => {
      const x = xs.at.get(n.name);
      const y = ys.at.get(n.name);

      if (x && y)
        cells.set(n.name, {
          x: x.center,
          y: y.center,
          size: Math.min(x.room, y.room),
          band: 0
        });
    });

    return {
      cells,
      width: xs.total,
      height: ys.total,
      cell: cellFor(xs.total, ys.total)
    };
  }

  // Stack each column, wrapping a tall one into side-by-side columns.
  const columns: Array<{
    room: number;
    items: Array<{ name: string; top: number; tall: number; size: number }>;
  }> = [];
  let rows = 0;

  xs.groups.forEach(({ nodes, room }) => {
    const sorted = [...nodes].sort((a, b) => a.y - b.y);
    const idleCount = sorted.filter(n => !ran(n)).length;
    const idle = Math.min(FOCUS_IDLE, IDLE_ROWS / Math.max(1, idleCount));
    let column: (typeof columns)[number] = { room, items: [] };
    let top = 0;

    columns.push(column);
    sorted.forEach(n => {
      const tall = ran(n) ? 1 : idle;

      if (top > 0 && top + tall > maxRows) {
        column = { room, items: [] };
        columns.push(column);
        top = 0;
      }
      column.items.push({
        name: n.name,
        top,
        tall,
        size: Math.min(room, tall)
      });
      top += tall;
      rows = Math.max(rows, top);
    });
  });

  // Wrap the columns into the number of lines that gives the largest cells.
  const total = columns.reduce((sum, c) => sum + c.room, 0);
  const widest = Math.max(...columns.map(c => c.room));
  const wrap = (lines: number) => {
    // Room for the widest column on top, so the greedy fill never spills into an extra line.
    const target = total / lines + widest;
    const at: Array<{ left: number; band: number }> = [];
    let left = 0;
    let band = 0;
    let width = 0;

    columns.forEach(c => {
      if (left > 0 && left + c.room > target + 1e-9) {
        band += 1;
        left = 0;
      }
      at.push({ left, band });
      left += c.room;
      width = Math.max(width, left);
    });

    const height = (band + 1) * rows + band * FOCUS_BAND_GAP;

    return { at, width, height, cell: cellFor(width, height) };
  };
  let best = wrap(1);

  for (let lines = 2; lines <= columns.length; lines += 1) {
    const next = wrap(lines);

    if (next.cell > best.cell + 1e-9) best = next;
    // Each line adds a run's height; past where it fits, more lines only shrink the cells.
    if (next.height > FOCUS_HEIGHT_PX / RAN_MIN_CELL_PX) break;
  }

  const cells: FocusFrame['cells'] = new Map();

  columns.forEach((c, i) => {
    const { left, band } = best.at[i] as { left: number; band: number };

    c.items.forEach(item =>
      cells.set(item.name, {
        x: left + c.room / 2,
        y: band * (rows + FOCUS_BAND_GAP) + item.top + item.tall / 2,
        size: item.size,
        band
      })
    );
  });

  return { cells, width: best.width, height: best.height, cell: best.cell };
}

/** The smallest cell the line search considers. */
const RAN_MIN_CELL_PX = 3;

export function frameStatus(
  frame: CardFrame,
  builds: Build[],
  virtualJobIds: Set<number>
): FrameStatus {
  const newest = new Map<number, Build>();

  builds.forEach(b => {
    const seen = newest.get(b.jobId);

    if (!seen || b.id > seen.id) newest.set(b.jobId, b);
  });

  const placed = new Set(frame.nodes.map(n => n.jobId));
  const byJob = new Map<number, string>();
  let removed = 0;

  newest.forEach((b, jobId) => {
    if (placed.has(jobId)) byJob.set(jobId, b.status);
    else if (!frame.jobIds.has(jobId) && !virtualJobIds.has(jobId))
      removed += 1;
  });

  return { byJob, removed };
}
