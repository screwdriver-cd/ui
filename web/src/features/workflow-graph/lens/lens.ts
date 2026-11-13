import type { DecoratedEdge, DecoratedNode } from '../decorate/decorate';
import { computeJoins, type JoinInfo } from '../decorate/joins';
import { nodeKind } from '../decorate/eligibility';
import { ancestorsOf, buildModel, descendantsOf, type WorkflowModel } from '../model';
import type { BuildLite } from '../types';

export type FlowBuild = Pick<BuildLite, 'id' | 'jobId' | 'status' | 'parentBuildId'>;

export type FlowState = 'done' | 'failed' | 'running' | 'queued' | 'pending' | 'wont-run';

export const FLOW_STATES: FlowState[] = ['done', 'failed', 'running', 'queued', 'pending', 'wont-run'];

export interface LensContext {
  model: WorkflowModel;
  nodes: Map<string, DecoratedNode>;
  joins: Map<string, JoinInfo>;
  /** Build -> node name, for builds that belong to this graph. */
  buildToNode: Map<number, string>;
  buildByNode: Map<string, FlowBuild>;
  states: Map<string, FlowState>;
}

const FAILED = new Set(['FAILURE', 'ABORTED', 'SKIPPED', 'COLLAPSED']);
const QUEUED = new Set(['QUEUED', 'BLOCKED', 'FROZEN', 'CREATED']);

/**
 * Builds the context the lens is computed from. Pure: depends only on the
 * decorated nodes/edges and the event's builds.
 */
export function createLensContext(input: {
  nodes: DecoratedNode[];
  edges: DecoratedEdge[];
  builds: FlowBuild[];
}): LensContext {
  const { graph: model } = buildModel({ nodes: input.nodes, edges: input.edges }, { log: () => {} });
  const nodes = new Map(input.nodes.map(n => [n.name, n]));
  const joins = computeJoins(input.edges.filter(e => nodes.has(e.src) && nodes.has(e.dest)));
  const buildById = new Map(input.builds.map(b => [Number(b.id), b]));
  const buildToNode = new Map<number, string>();
  const buildByNode = new Map<string, FlowBuild>();

  input.nodes.forEach(n => {
    if (n.buildId !== undefined && buildById.has(Number(n.buildId))) {
      buildToNode.set(Number(n.buildId), n.name);
      buildByNode.set(n.name, buildById.get(Number(n.buildId)) as FlowBuild);
    } else if (nodeKind(n) === 'stage-group' && n.status) {
      // A collapsed stage has no job build of its own; its status is the stage build's. A negative id keeps it
      // clear of real build ids (it is never anyone's parentBuildId).
      const id = -(buildByNode.size + 1);

      buildToNode.set(id, n.name);
      buildByNode.set(n.name, { id, jobId: -1, status: n.status } as FlowBuild);
    }
  });

  const hasStart = input.nodes.some(n => n.status === 'STARTED_FROM');
  const states = new Map<string, FlowState>();
  const visiting = new Set<string>();

  // dead: finished unsuccessfully, or can never run in this event
  const stateOf = (name: string): FlowState => {
    const cached = states.get(name);

    if (cached) return cached;

    const n = nodes.get(name) as DecoratedNode;
    const build = buildByNode.get(name);
    let state: FlowState;

    if (build) {
      if (build.status === 'RUNNING') state = 'running';
      else if (QUEUED.has(build.status)) state = 'queued';
      else if (FAILED.has(build.status)) state = 'failed';
      else state = 'done';
    } else if (nodeKind(n) === 'trigger') {
      state = n.status === 'STARTED_FROM' || !hasStart ? (n.status === 'STARTED_FROM' ? 'done' : 'pending') : 'wont-run';
    } else if (n.status === 'DISABLED') {
      state = 'wont-run';
    } else if (visiting.has(name)) {
      return 'pending'; // cycle: assume it may run
    } else {
      visiting.add(name);

      const isDead = (src: string) => {
        const s = stateOf(src);

        return s === 'failed' || s === 'wont-run';
      };
      const sources = model.inNeighbors(name);

      if (sources.length === 0) {
        state = 'pending';
      } else {
        const join = joins.get(name);
        let canRun: boolean;

        if (join?.kind === 'AND') {
          const andOk = join.inputs.every(s => !isDead(s));
          const altOk = join.alternatives.some(s => !isDead(s));

          canRun = andOk || altOk;
        } else {
          canRun = sources.some(s => !isDead(s));
        }

        state = canRun ? 'pending' : 'wont-run';
      }

      visiting.delete(name);
    }

    states.set(name, state);

    return state;
  };

  input.nodes.forEach(n => stateOf(n.name));

  return { model, nodes, joins, buildToNode, buildByNode, states };
}

const edgeKey = (src: string, dest: string) => `${src}->${dest}`;

export type UpstreamRoute = {
  /** Nodes on the route that actually ran in this event (excludes the focus). */
  taken: Set<string>;
  takenEdges: Set<string>;
  /** Upstream nodes that could have led here but did not run in this event. */
  possible: Set<string>;
  possibleEdges: Set<string>;
  /** True when parentBuildId was missing for some hop and the route was inferred. */
  inferred: boolean;
};

export interface JoinWaiting {
  name: string;
  satisfied: string[];
  pending: string[];
  total: number;
}

export interface DownstreamInPlay {
  running: string[];
  queued: string[];
  done: string[];
  failed: string[];
  waitingOnJoin: JoinWaiting[];
  wontRun: string[];
  /** Can still run, nothing in flight yet. */
  pending: string[];
}

export type LensTier = 'focus' | 'upstream-taken' | 'upstream-possible' | 'downstream' | 'dimmed';

export interface Lens {
  focus: string;
  upstream: UpstreamRoute;
  downstream: DownstreamInPlay;
  tierOf: (name: string) => LensTier;
  edgeTierOf: (src: string, dest: string) => LensTier;
}

function parentsOf(build: FlowBuild | undefined): number[] {
  const p = build?.parentBuildId;

  if (p === undefined || p === null || p === '') return [];

  // The API sends a number, or an array of numbers for joins. The Ember model declares the
  // attribute as a string, so a join can also arrive as "2,3,4".
  return (Array.isArray(p) ? p : [p])
    .flatMap((v): Array<number | string> => (typeof v === 'string' ? v.split(',') : [v]))
    .map(v => (typeof v === 'string' && v.trim() === '' ? NaN : Number(v)))
    .filter(n => Number.isFinite(n));
}

/** The upstream route actually taken to reach `focus`, using build lineage with a fallback. */
export function upstreamRoute(ctx: LensContext, focus: string): UpstreamRoute {
  const taken = new Set<string>();
  const takenEdges = new Set<string>();
  let inferred = false;
  const visited = new Set<string>();
  const hasBuild = (n: string) => ctx.buildByNode.has(n);
  const isStart = (n: string) => ctx.nodes.get(n)?.status === 'STARTED_FROM';

  const walk = (name: string) => {
    if (visited.has(name) || !hasBuild(name)) return;
    visited.add(name);

    let parents = parentsOf(ctx.buildByNode.get(name))
      .map(id => ctx.buildToNode.get(id))
      .filter((n): n is string => !!n && n !== name);

    if (!parents.length) {
      const preds = ctx.model.inNeighbors(name);
      const starts = preds.filter(isStart);

      if (starts.length) {
        // Root build of the event: started by the trigger.
        parents = starts;
      } else {
        // No lineage in the payload: infer from adjacent nodes that have a build.
        parents = preds.filter(hasBuild);
        if (parents.length) inferred = true;
      }
    }

    parents.forEach(p => {
      taken.add(p);
      takenEdges.add(edgeKey(p, name));
      walk(p);
    });
  };

  walk(focus);
  taken.delete(focus);

  const possible = new Set<string>();
  const possibleEdges = new Set<string>();
  const anc = ancestorsOf(ctx.model, focus);

  anc.forEach(a => {
    if (!taken.has(a)) possible.add(a);
  });
  ctx.model.forEachEdge((_, __, src, dest) => {
    if ((anc.has(src) || src === focus) && (anc.has(dest) || dest === focus) && !takenEdges.has(edgeKey(src, dest))) {
      possibleEdges.add(edgeKey(src, dest));
    }
  });

  if (!ctx.buildByNode.has(focus) && taken.size === 0) {
    // Focus did not run: show ancestors that did run as an inferred route.
    anc.forEach(a => {
      if (hasBuild(a) || isStart(a)) {
        taken.add(a);
        possible.delete(a);
        inferred = true;
      }
    });
    ctx.model.forEachEdge((_, __, src, dest) => {
      if (taken.has(src) && (taken.has(dest) || dest === focus)) {
        takenEdges.add(edgeKey(src, dest));
        possibleEdges.delete(edgeKey(src, dest));
      }
    });
  }

  return { taken, takenEdges, possible, possibleEdges, inferred };
}

/** Descendants of `focus` grouped by what is going to happen to them. */
export function downstreamInPlay(ctx: LensContext, focus: string): DownstreamInPlay {
  const out: DownstreamInPlay = { running: [], queued: [], done: [], failed: [], waitingOnJoin: [], wontRun: [], pending: [] };
  const order = ctx.model.nodes();

  const desc = descendantsOf(ctx.model, focus);

  order.forEach(name => {
    if (!desc.has(name)) return;

    const state = ctx.states.get(name) as FlowState;

    switch (state) {
      case 'running':
        out.running.push(name);
        break;
      case 'queued':
        out.queued.push(name);
        break;
      case 'done':
        out.done.push(name);
        break;
      case 'failed':
        out.failed.push(name);
        break;
      case 'wont-run':
        out.wontRun.push(name);
        break;
      default: {
        const join = ctx.joins.get(name);

        if (join?.kind === 'AND') {
          const satisfied = join.inputs.filter(i => ctx.states.get(i) === 'done');

          out.waitingOnJoin.push({
            name,
            satisfied,
            pending: join.inputs.filter(i => !satisfied.includes(i)),
            total: join.inputs.length
          });
        } else {
          out.pending.push(name);
        }
      }
    }
  });

  return out;
}

export function lensFor(ctx: LensContext, focus: string): Lens | null {
  if (!ctx.model.hasNode(focus)) return null;

  const upstream = upstreamRoute(ctx, focus);
  const downstream = descendantsOf(ctx.model, focus);
  const tierOf = (name: string): LensTier => {
    if (name === focus) return 'focus';
    if (upstream.taken.has(name)) return 'upstream-taken';
    if (upstream.possible.has(name)) return 'upstream-possible';
    if (downstream.has(name)) return 'downstream';

    return 'dimmed';
  };
  const edgeTierOf = (src: string, dest: string): LensTier => {
    const k = edgeKey(src, dest);

    if (upstream.takenEdges.has(k)) return 'upstream-taken';
    if (upstream.possibleEdges.has(k)) return 'upstream-possible';
    if ((src === focus || downstream.has(src)) && downstream.has(dest)) return 'downstream';

    return 'dimmed';
  };

  return { focus, upstream, downstream: downstreamInPlay(ctx, focus), tierOf, edgeTierOf };
}

export interface Progress {
  total: number;
  done: number;
  failed: number;
  running: number;
  queued: number;
  pending: number;
  wontRun: number;
  byState: Record<FlowState, string[]>;
}

/** Event progress over real jobs (triggers and downstream-trigger summaries are excluded). */
export function progressOf(ctx: LensContext): Progress {
  const byState: Record<FlowState, string[]> = { done: [], failed: [], running: [], queued: [], pending: [], 'wont-run': [] };

  ctx.model.forEachNode(name => {
    const kind = nodeKind(ctx.nodes.get(name) as DecoratedNode);

    if (kind === 'trigger' || kind === 'downstream') return;
    byState[ctx.states.get(name) as FlowState].push(name);
  });

  const len = (s: FlowState) => byState[s].length;

  return {
    total: FLOW_STATES.reduce((a, s) => a + len(s), 0),
    done: len('done'),
    failed: len('failed'),
    running: len('running'),
    queued: len('queued'),
    pending: len('pending'),
    wontRun: len('wont-run'),
    byState
  };
}

/** Running and blocked builds, for "jump to active". */
export function activeNodes(ctx: LensContext): string[] {
  return ctx.model.filterNodes(n => {
    const s = ctx.buildByNode.get(n)?.status;

    return s === 'RUNNING' || s === 'BLOCKED';
  });
}
