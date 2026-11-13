import { beforeEach, describe, expect, it } from 'vitest';

import { decorateGraph } from '../decorate';
import {
  COMPLEX_GRAPH,
  JOIN_GRAPH,
  MORE_COMPLEX_GRAPH,
  SIMPLE_GRAPH,
  STAGES,
  STAGES_GRAPH,
  STAGE_JOBS
} from '../fixtures/graphs';
import { stressGraph } from '../fixtures/stress';
import type { WorkflowGraphData } from '../types';
import { clearLayoutCache, computeLayout } from './client';
import { countCrossings } from './crossings';
import { toLayoutInput } from './input';
import { createTextMeasurer } from './measure';

const measure = createTextMeasurer();

beforeEach(() => clearLayoutCache());

async function crossingsOf(input: Parameters<typeof decorateGraph>[0]) {
  const r = await computeLayout(toLayoutInput(decorateGraph(input), { measure }));

  // Only edges the user sees: hidden bypass edges are drawn only where they attach to a stage box.
  return countCrossings(
    r.edges
      .filter(e => !e.hidden || e.layoutSrc !== e.src || e.layoutDest !== e.dest)
      .map(e => ({ src: e.layoutSrc, dest: e.layoutDest, points: e.points }))
  );
}

interface Case {
  name: string;
  graph: WorkflowGraphData;
  stages?: typeof STAGES;
  jobs?: typeof STAGE_JOBS;
  collapsed?: string[];
  budget: number;
}

// Budgets are the measured crossings. misordered: K3,2 between two layers, so 3 is the minimum.
const CASES: Case[] = [
  { name: 'simple', graph: SIMPLE_GRAPH, budget: 0 },
  { name: 'complex', graph: COMPLEX_GRAPH, budget: 0 },
  { name: 'misordered + detached + remote', graph: MORE_COMPLEX_GRAPH, budget: 3 },
  { name: 'joins', graph: JOIN_GRAPH, budget: 3 },
  { name: 'stages', graph: STAGES_GRAPH, stages: STAGES, jobs: STAGE_JOBS, budget: 0 },
  { name: 'collapsed stage', graph: STAGES_GRAPH, stages: STAGES, jobs: STAGE_JOBS, collapsed: ['production'], budget: 0 }
];

describe('edge crossing budgets', () => {
  it.each(CASES)('$name: at most $budget', async c => {
    const crossings = await crossingsOf({
      graph: c.graph,
      stages: c.stages,
      jobs: c.jobs,
      collapsedStages: new Set(c.collapsed ?? [])
    });

    expect(crossings).toBeLessThanOrEqual(c.budget);
  });

  it('stress graph (4 stages x 24 jobs): at most 12', async () => {
    const { graph, stageMeta } = stressGraph(4, 24);

    expect(await crossingsOf({ graph, stages: stageMeta, collapsedStages: new Set() })).toBeLessThanOrEqual(12);
  }, 30000);
});
