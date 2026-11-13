import type {
  BuildLite,
  JobLite,
  PipelineStage,
  StageBuildLite,
  WorkflowEdge,
  WorkflowGraphData,
  WorkflowNode
} from '../types';
import {
  STAGE_COLLAPSED_JOB_PATTERN,
  STAGE_SETUP_PATTERN,
  STAGE_TEARDOWN_PATTERN,
  isStageCollapsedJob,
  isStageSetupJob,
  isStageTeardownJob,
  isTrigger
} from './names';
import { subgraphFilter } from './subgraph';

export interface DecoratedNode extends WorkflowNode {
  buildId?: number;
  isDisabled?: boolean;
  manualStartDisabled?: boolean;
  stateChanger?: string;
  stateChangeMessage?: string;
}

export interface DecoratedEdge extends WorkflowEdge {
  hidden?: boolean;
  status?: string;
}

export interface EventStage {
  name: string;
  id?: number;
  description?: string;
  jobs: DecoratedNode[];
  setup: DecoratedNode | null;
  teardown: DecoratedNode | null;
  isCollapsed: boolean;
  manualStartDisabled?: boolean;
  status?: string;
  stageBuildId?: number;
}

export interface StageEdge extends DecoratedEdge {
  srcStageName?: string;
  destStageName?: string;
}

export interface DecoratedGraph {
  nodes: DecoratedNode[];
  edges: DecoratedEdge[];
  stages: EventStage[];
  stageEdges: StageEdge[];
}

export interface DecorateInput {
  graph: WorkflowGraphData;
  builds?: BuildLite[];
  stageBuilds?: StageBuildLite[];
  jobs?: JobLite[];
  /** Node name that started the event (`~commit`, `~pr`, `~commit:branch`, ...). */
  start?: string;
  chainPR?: boolean;
  prNum?: number;
  /** Pipeline stage metadata. Without it, stage nodes are regular nodes. */
  stages?: PipelineStage[];
  collapsedStages?: ReadonlySet<string>;
}

const findNode = <T extends { name: string }>(list: T[], name: string): T | undefined =>
  list.find(o => o.name === name);

const eq = (a: unknown, b: unknown) => `${a}` === `${b}`;

function extractEventStages(nodes: WorkflowNode[]): EventStage[] {
  const map = new Map<string, EventStage>();

  nodes.forEach(n => {
    if (!n.stageName) {
      return;
    }

    let stage = map.get(n.stageName);

    if (!stage) {
      stage = { name: n.stageName, jobs: [], setup: null, teardown: null, isCollapsed: false };
      map.set(n.stageName, stage);
    }

    if (isStageSetupJob(n.name)) {
      stage.setup = n;
    } else if (isStageTeardownJob(n.name)) {
      stage.teardown = n;
    } else {
      stage.jobs.push(n);
    }
  });

  return [...map.values()];
}

function collapseStage(stage: EventStage, nodes: DecoratedNode[], edges: DecoratedEdge[]) {
  const stageJobNames = stage.jobs.map(j => j.name);
  const group: DecoratedNode = {
    name: `stage@${stage.name} jobs (${stageJobNames.length})`,
    description: `This job group includes the following jobs: ${stageJobNames.join(', ')}`,
    stageName: stage.name,
    type: 'JOB_GROUP'
  };
  const outNodes: DecoratedNode[] = [];
  let groupAdded = false;

  nodes.forEach(n => {
    if (n.stageName !== stage.name) {
      outNodes.push(n);
    } else if (!groupAdded) {
      outNodes.push(group);
      groupAdded = true;
    }
  });

  const inStage = new Set(stageJobNames);

  if (stage.setup) inStage.add(stage.setup.name);
  if (stage.teardown) inStage.add(stage.teardown.name);

  const outEdges: DecoratedEdge[] = [];

  edges.forEach(e => {
    const srcIn = inStage.has(e.src);
    const destIn = inStage.has(e.dest);

    if (srcIn && destIn) {
      return;
    }

    const copy = { ...e };

    if (srcIn) copy.src = group.name;
    else if (destIn) copy.dest = group.name;
    outEdges.push(copy);
  });

  stage.jobs = [group];

  return { nodes: outNodes, edges: outEdges };
}

function bypassEdges(edges: DecoratedEdge[], nodeName: string, hasStages: boolean): DecoratedEdge[] {
  const result: DecoratedEdge[] = [];
  const asSrc: DecoratedEdge[] = [];
  const asDest: DecoratedEdge[] = [];

  edges.forEach(e => {
    if (e.src === nodeName) asSrc.push(e);
    else if (e.dest === nodeName) asDest.push(e);
    else result.push(e);
  });

  if (asSrc.length && asDest.length) {
    asSrc.forEach(s => {
      asDest.forEach(d => {
        const copy: DecoratedEdge = { ...d, dest: s.dest };

        if (hasStages) copy.hidden = true;
        result.push(copy);
      });
    });
  }

  return result;
}

function toStageEdges(hasStages: boolean, edges: DecoratedEdge[]): StageEdge[] {
  const out: StageEdge[] = [];

  if (!hasStages) {
    return out;
  }

  edges.forEach(e => {
    if (
      isStageSetupJob(e.dest) ||
      isStageTeardownJob(e.src) ||
      isStageCollapsedJob(e.dest) ||
      isStageCollapsedJob(e.src)
    ) {
      e.hidden = true;

      const se: StageEdge = { ...e };

      if (isStageSetupJob(e.dest)) se.destStageName = e.dest.match(STAGE_SETUP_PATTERN)?.[1];
      else if (isStageCollapsedJob(e.dest)) se.destStageName = e.dest.match(STAGE_COLLAPSED_JOB_PATTERN)?.[1];

      if (isStageTeardownJob(e.src)) se.srcStageName = e.src.match(STAGE_TEARDOWN_PATTERN)?.[1];
      else if (isStageCollapsedJob(e.src)) se.srcStageName = e.src.match(STAGE_COLLAPSED_JOB_PATTERN)?.[1];

      out.push(se);
    }
  });

  return out;
}

/**
 * Decorates the API workflow graph with status, build ids, disabled/manual-start
 * flags, STARTED_FROM, stage grouping and stage edges. Pure: the input is not
 * mutated. Positions are not computed here (see ../layout).
 */
export function decorateGraph(input: DecorateInput): DecoratedGraph {
  const { builds, stageBuilds, jobs, start, chainPR, prNum, stages: pipelineStages, collapsedStages } = input;
  const original = structuredClone(input.graph);

  const buildsAvailable = !!builds?.length;
  const stageBuildsAvailable = !!stageBuilds?.length;
  const jobsAvailable = !!jobs?.length;

  const eventStages: EventStage[] = pipelineStages?.length ? extractEventStages(original.nodes) : [];

  // Enrich event stages from the pipeline stage definitions.
  const stageByName = new Map((pipelineStages ?? []).map(s => [s.name, s]));

  eventStages.forEach(es => {
    const ps = stageByName.get(prNum ? `PR-${prNum}:${es.name}` : es.name);

    if (ps) {
      es.id = ps.id;
      es.description = ps.description;
    }
  });

  const hasStages = eventStages.length > 0;

  let collapsedNodes: DecoratedNode[] = [...original.nodes];
  let collapsedEdges: DecoratedEdge[] = [...original.edges];

  eventStages.forEach(s => {
    s.isCollapsed = !!collapsedStages?.has(s.name);

    if (s.isCollapsed) {
      const r = collapseStage(s, collapsedNodes, collapsedEdges);

      collapsedNodes = r.nodes;
      collapsedEdges = r.edges;
    }
  });

  const virtualSetup: DecoratedNode[] = [];
  const virtualTeardown: DecoratedNode[] = [];
  const nodes: DecoratedNode[] = [];

  collapsedNodes.forEach(n => {
    if (n.displayName) n.displayName = String(n.displayName);

    if (n.virtual && isStageSetupJob(n.name)) virtualSetup.push(n);
    else if (n.virtual && isStageTeardownJob(n.name)) virtualTeardown.push(n);
    else nodes.push(n);
  });

  let edges = collapsedEdges;
  const stageEdges = toStageEdges(hasStages, edges);

  virtualSetup.forEach(n => {
    edges = bypassEdges(edges, n.name, hasStages);
  });
  virtualTeardown.forEach(n => {
    edges = bypassEdges(edges, n.name, hasStages);
  });

  // Stage status
  eventStages.forEach(s => {
    const stage = stageByName.get(prNum ? `PR-${prNum}:${s.name}` : s.name);

    if (!stage) return;

    s.id = stage.id;

    // The stages API returns no annotations (Ember reads them anyway): starting a stage starts
    // its setup job, so that job's manual-start setting decides.
    const setupJob = stage.setup === undefined ? undefined : jobs?.find(j => j && eq(j.id, stage.setup));
    const setupAnnotations = setupJob?.permutations?.[0]?.annotations;

    if (stage.annotations) {
      s.manualStartDisabled = !stage.annotations['screwdriver.cd/manualStartEnabled'];
    } else if (setupAnnotations && 'screwdriver.cd/manualStartEnabled' in setupAnnotations) {
      s.manualStartDisabled = !setupAnnotations['screwdriver.cd/manualStartEnabled'];
    }

    if (stageBuildsAvailable) {
      const sb = stageBuilds?.find(b => eq(b.stageId, stage.id));

      if (sb) {
        s.status = sb.status;
        s.stageBuildId = sb.id;
      }
    }
  });

  // Node status
  nodes.forEach(n => {
    if (n.type === 'JOB_GROUP') {
      const stage = eventStages.find(s => s.name === n.stageName);

      if (stage?.status) n.status = stage.status;

      return;
    }

    let jobId: number | undefined = n.id;

    if (jobsAvailable && jobs) {
      let job = jobs.find(j => j && eq(j.id, jobId));

      if (!jobId && !chainPR && prNum) {
        job = jobs.find(j => j && j.group === prNum && j.name.split(`PR-${prNum}:`)[1] === n.name);
        jobId = job?.id;
        // Keep the resolved PR job id on the node: the popover's actions and links act on it.
        if (jobId !== undefined) n.id = jobId;
      }

      const originalJob = job?.prParentJobId ? jobs.find(j => j && eq(j.id, job?.prParentJobId)) : job;

      n.isDisabled = !!originalJob?.isDisabled;

      if (n.isDisabled && originalJob) {
        n.status = originalJob.state;
        n.stateChanger = originalJob.stateChanger;
        n.stateChangeMessage = originalJob.stateChangeMessage;
      }

      const annotations = job?.permutations?.[0]?.annotations;

      if (annotations) {
        n.manualStartDisabled =
          'screwdriver.cd/manualStartEnabled' in annotations ? !annotations['screwdriver.cd/manualStartEnabled'] : false;
      }

      const description = job?.permutations?.[0]?.description;

      if (description) n.description = description;
    }

    if (buildsAvailable && jobId) {
      const b = builds?.find(x => x && eq(x.jobId, jobId));

      if (b) {
        n.status = b.status;
        n.buildId = b.id;
      }
    }

    if (start && isTrigger(n.name, start)) {
      n.status = 'STARTED_FROM';
    }
  });

  const prTriggered =
    !chainPR && prNum
      ? subgraphFilter({ nodes, edges }, '~pr').nodes.filter(n => n.name !== '~pr')
      : null;
  const prTriggeredNames = new Set(prTriggered?.map(n => n.name));

  edges.forEach(e => {
    const srcNode = findNode(nodes, e.src);
    const destNode = findNode(nodes, e.dest);

    if (!srcNode || !destNode) {
      e.hidden = true;

      return;
    }

    if (srcNode.status && srcNode.status !== 'RUNNING' && !prTriggeredNames.has(srcNode.name)) {
      e.status = srcNode.status;
    }
  });

  stageEdges.forEach(e => {
    const srcNode = findNode(collapsedNodes, e.src);
    const destNode = findNode(collapsedNodes, e.dest);

    if (!srcNode || !destNode) return;

    const srcStage = eventStages.find(s => s.name === e.srcStageName);

    if (srcStage) {
      e.status = srcStage.status;
    } else if (srcNode.status && srcNode.status !== 'RUNNING' && !prTriggeredNames.has(srcNode.name)) {
      e.status = srcNode.status;
    }
  });

  return { nodes, edges, stages: eventStages, stageEdges };
}
