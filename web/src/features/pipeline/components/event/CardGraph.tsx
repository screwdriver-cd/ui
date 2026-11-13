import type { CSSProperties } from 'react';
import { statusClass } from '~/features/workflow-graph/render/status';
import { useT } from '~/i18n/useT';
import {
  FOCUS_NODE,
  focusFrame,
  packFrame,
  type CardFrame,
  type FrameStatus
} from '../../hooks/useCardFrame';

export type CardGraphKind = 'strip' | 'ghost' | 'grid' | 'focus';

export const CARD_GRAPH_KINDS: readonly CardGraphKind[] = [
  'strip',
  'ghost',
  'grid',
  'focus'
];

interface CardGraphProps {
  frame: CardFrame;
  status: FrameStatus;
  virtualJobIds: Set<number>;
}

const cellClass = (status?: string) =>
  status ? `card-graph-cell ${statusClass(status)}` : 'card-graph-cell not-run';

function Removed({ count }: { count: number }) {
  const t = useT();

  return count > 0 ? (
    <span className="card-graph-removed">
      {t('pipeline.card.graphRemoved', { count })}
    </span>
  ) : null;
}

/**
 * Option A: one cell per pipeline job, in the frame's reading order on every card, so two
 * events that ran different jobs never look alike.
 */
export function CardStrip({ frame, status, virtualJobIds }: CardGraphProps) {
  const t = useT();
  const jobs = frame.nodes.filter(
    n =>
      n.kind === 'job' &&
      !n.virtual &&
      n.jobId !== undefined &&
      !virtualJobIds.has(n.jobId)
  );
  const ran = jobs.filter(n => status.byJob.has(n.jobId as number)).length;

  return (
    <div className="card-graph card-strip">
      <div
        className="card-strip-cells"
        role="img"
        aria-label={t('pipeline.card.graphSummary', {
          ran,
          total: jobs.length
        })}
        style={
          {
            '--rows': Math.min(4, Math.max(1, Math.ceil(jobs.length / 26)))
          } as CSSProperties
        }
      >
        {jobs.map(n => {
          const s = status.byJob.get(n.jobId as number);

          return (
            <span
              key={n.name}
              className={cellClass(s)}
              title={`${n.name}: ${s ?? t('pipeline.card.graphNotRun')}`}
            />
          );
        })}
      </div>
      <Removed count={status.removed} />
    </div>
  );
}

/** Option B: the whole pipeline in miniature, at the same place on every card; jobs that did not run are greyed out. */
export function CardGhostGraph({ frame, status }: CardGraphProps) {
  const t = useT();
  const pos = new Map(frame.nodes.map(n => [n.name, n]));
  const ran = (name: string) => {
    const id = pos.get(name)?.jobId;

    return id !== undefined && status.byJob.has(id);
  };
  const jobs = frame.nodes.filter(n => n.kind === 'job');
  const pad = 4;

  return (
    <div className="card-graph card-ghost">
      <svg
        role="img"
        aria-label={t('pipeline.card.graphSummary', {
          ran: jobs.filter(n => ran(n.name)).length,
          total: jobs.length
        })}
        viewBox={`${-pad} ${-pad} ${frame.width + pad * 2} ${
          frame.height + pad * 2
        }`}
        preserveAspectRatio="xMidYMid meet"
      >
        {frame.edges.map(e => {
          const a = pos.get(e.src);
          const b = pos.get(e.dest);

          if (!a || !b) return null;

          return (
            <line
              key={`${e.src}->${e.dest}`}
              className={ran(e.src) && ran(e.dest) ? 'edge ran' : 'edge'}
              x1={a.x + a.width}
              y1={a.y + a.height / 2}
              x2={b.x}
              y2={b.y + b.height / 2}
            />
          );
        })}
        {frame.nodes.map(n => {
          const s =
            n.jobId === undefined ? undefined : status.byJob.get(n.jobId);

          return (
            <rect
              key={n.name}
              className={
                n.kind === 'job' ? cellClass(s) : `card-graph-cell ${n.kind}`
              }
              x={n.x}
              y={n.y}
              width={n.width}
              height={n.height}
              rx={n.kind === 'job' ? 3 : n.width / 2}
            >
              <title>{`${n.name}${
                n.kind === 'job'
                  ? `: ${s ?? t('pipeline.card.graphNotRun')}`
                  : ''
              }`}</title>
            </rect>
          );
        })}
      </svg>
      <Removed count={status.removed} />
    </div>
  );
}

/**
 * Option C: the ghost graph packed onto a grid that fills the card (ELK's column order kept,
 * tall columns and long pipelines wrapped), with what ran filled and its path drawn in the status colour.
 */
export function CardGridGraph({ frame, status }: CardGraphProps) {
  const t = useT();
  const grid = packFrame(frame);
  const byName = new Map(frame.nodes.map(n => [n.name, n]));
  const statusOf = (name: string) => {
    const id = byName.get(name)?.jobId;

    return id === undefined ? undefined : status.byJob.get(id);
  };
  const jobs = frame.nodes.filter(n => n.kind === 'job');
  const inset = 0.15;
  const size = 1 - inset * 2;
  // Edges that ran draw last, over the faint ones.
  const edges = frame.edges
    .map(e => ({
      ...e,
      a: grid.cells.get(e.src),
      b: grid.cells.get(e.dest),
      ran: Boolean(statusOf(e.src) && statusOf(e.dest))
    }))
    .sort((x, y) => Number(x.ran) - Number(y.ran));

  return (
    <div className="card-graph card-grid">
      <svg
        role="img"
        aria-label={t('pipeline.card.graphSummary', {
          ran: jobs.filter(n => statusOf(n.name)).length,
          total: jobs.length
        })}
        viewBox={`0 0 ${grid.cols} ${grid.rows}`}
        preserveAspectRatio="xMinYMid meet"
      >
        {edges.map(({ src, dest, a, b, ran }) =>
          // An edge between bands would cut across the card.
          a && b && a.band === b.band ? (
            <line
              key={`${src}->${dest}`}
              className={
                ran
                  ? `edge ran ${statusClass(statusOf(dest) as string)}`
                  : 'edge'
              }
              x1={a.col + 1 - inset}
              y1={a.row + 0.5}
              x2={b.col + inset}
              y2={b.row + 0.5}
            />
          ) : null
        )}
        {frame.nodes.map(n => {
          const at = grid.cells.get(n.name);

          if (!at) return null;

          const s = statusOf(n.name);
          const job = n.kind === 'job';

          return (
            <rect
              key={n.name}
              className={job ? cellClass(s) : `card-graph-cell ${n.kind}`}
              x={at.col + inset}
              y={at.row + inset}
              width={size}
              height={size}
              rx={job ? 0.15 : size / 2}
            >
              <title>{`${n.name}${
                job ? `: ${s ?? t('pipeline.card.graphNotRun')}` : ''
              }`}</title>
            </rect>
          );
        })}
      </svg>
      <Removed count={status.removed} />
    </div>
  );
}

/** Trigger names compare by their kind of trigger alone: `~commit:main` is started from `~commit`. */
const triggerBase = (name: string) =>
  name.startsWith('~sd@') ? name : name.split(':')[0];

/**
 * The trigger or upstream pipeline the event started from: the node `startFrom` names, or else (a
 * branch-filtered trigger such as `~commit:main`) one of the same kind that leads to a job that ran.
 */
function sourceOf(
  frame: CardFrame,
  status: FrameStatus,
  startFrom: string | undefined
) {
  if (!startFrom) return undefined;

  const sources = frame.nodes.filter(n => n.kind !== 'job');
  const exact = sources.find(n => n.name === startFrom);

  if (exact) return exact.name;

  const ran = new Set(
    frame.nodes
      .filter(n => n.jobId !== undefined && status.byJob.has(n.jobId))
      .map(n => n.name)
  );
  const started = new Set(
    frame.edges.filter(e => ran.has(e.dest)).map(e => e.src)
  );

  return sources.find(
    n => triggerBase(n.name) === triggerBase(startFrom) && started.has(n.name)
  )?.name;
}

/** A job that didn't run, as a share of a cell. */
const FOCUS_DOT = 0.2;

/**
 * Option D: the ghost graph with what ran given the room. Every node keeps its row and column from
 * the pipeline's layout, but rows and columns where nothing ran shrink, so the jobs that ran
 * grow and the rest stay in place as small, faint context.
 */
export function CardFocusGraph({
  frame: pipeline,
  status,
  startFrom
}: CardGraphProps & { startFrom?: string }) {
  const t = useT();
  // Of the triggers and other pipelines, only the one the event started from is shown; the rest (all
  // of them, for a restart from a job) take no room.
  const source = sourceOf(pipeline, status, startFrom);
  const visible = pipeline.nodes.filter(
    n => n.kind === 'job' || n.name === source
  );
  const kept = new Set(visible.map(n => n.name));
  const frame = {
    ...pipeline,
    nodes: visible,
    edges: pipeline.edges.filter(e => kept.has(e.src) && kept.has(e.dest))
  };
  const byName = new Map(frame.nodes.map(n => [n.name, n]));
  const statusOf = (name: string) => {
    const id = byName.get(name)?.jobId;

    return id === undefined ? undefined : status.byJob.get(id);
  };
  // The node the event started from is part of the run.
  const inRun = (name: string) => Boolean(statusOf(name)) || name === source;
  const focus = focusFrame(frame, n => inRun(n.name));
  const jobs = frame.nodes.filter(n => n.kind === 'job');
  const pad = 0.5;
  const vbWidth = focus.width + pad * 2;
  const vbHeight = focus.height + pad * 2;
  const { cell } = focus;
  const edges = frame.edges
    .map(e => ({
      ...e,
      a: focus.cells.get(e.src),
      b: focus.cells.get(e.dest),
      ran: inRun(e.src) && inRun(e.dest)
    }))
    .sort((x, y) => Number(x.ran) - Number(y.ran));
  // Draw what ran last, on top of the background.
  const nodes = [...frame.nodes].sort(
    (x, y) => Number(inRun(x.name)) - Number(inRun(y.name))
  );

  return (
    <div className="card-graph card-focus">
      <svg
        role="img"
        aria-label={t('pipeline.card.graphSummary', {
          ran: jobs.filter(n => statusOf(n.name)).length,
          total: jobs.length
        })}
        viewBox={`${-pad} ${-pad} ${vbWidth} ${vbHeight}`}
        width={vbWidth * cell}
        height={vbHeight * cell}
      >
        {edges.map(({ src, dest, a, b, ran }) =>
          a && b && a.band === b.band ? (
            <line
              key={`${src}->${dest}`}
              className={
                ran
                  ? `edge ran ${statusClass(statusOf(dest) as string)}`
                  : 'edge'
              }
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
            />
          ) : null
        )}
        {nodes.map(n => {
          const at = focus.cells.get(n.name);

          if (!at) return null;

          const s = statusOf(n.name);
          const job = n.kind === 'job';
          const ran = inRun(n.name);
          // A job that didn't run is a dot, wherever it sits: faint context for where the run is.
          const size = ran ? at.size * FOCUS_NODE : FOCUS_DOT;

          return (
            <rect
              key={n.name}
              className={job ? cellClass(s) : `card-graph-cell ${n.kind} ran`}
              x={at.x - size / 2}
              y={at.y - size / 2}
              width={size}
              height={size}
              rx={job && ran ? size * 0.2 : size / 2}
            >
              <title>{`${n.name}${job ? `: ${s ?? t('pipeline.card.graphNotRun')}` : ''}`}</title>
            </rect>
          );
        })}
      </svg>
      <Removed count={status.removed} />
    </div>
  );
}
