import { beforeEach, describe, expect, it } from 'vitest';

import { decorateGraph } from '../decorate';
import { clearLayoutCache, computeLayout } from '../layout/client';
import { countCrossings } from '../layout/crossings';
import { toLayoutInput } from '../layout/input';
import { createTextMeasurer } from '../layout/measure';
import {
  COMPLEX_GRAPH,
  JOIN_GRAPH,
  MORE_COMPLEX_GRAPH,
  SIMPLE_GRAPH,
  STAGES,
  STAGES_GRAPH,
  STAGE_JOBS
} from '../fixtures/graphs';
import type { WorkflowGraphData } from '../types';
import { legacyLayout } from './legacy';

const measure = createTextMeasurer();

beforeEach(() => clearLayoutCache());

interface Case {
  name: string;
  graph: WorkflowGraphData;
  stages?: typeof STAGES;
  jobs?: typeof STAGE_JOBS;
  collapsed?: string[];
}

const CASES: Case[] = [
  { name: 'simple', graph: SIMPLE_GRAPH },
  { name: 'complex', graph: COMPLEX_GRAPH },
  { name: 'misordered + detached + remote', graph: MORE_COMPLEX_GRAPH },
  { name: 'joins', graph: JOIN_GRAPH },
  { name: 'stages', graph: STAGES_GRAPH, stages: STAGES, jobs: STAGE_JOBS },
  { name: 'collapsed stage', graph: STAGES_GRAPH, stages: STAGES, jobs: STAGE_JOBS, collapsed: ['production'] }
];

async function newLayout(c: Case) {
  const d = decorateGraph({ graph: c.graph, stages: c.stages, jobs: c.jobs, collapsedStages: new Set(c.collapsed ?? []) });
  const r = await computeLayout(toLayoutInput(d, { measure }));

  return {
    result: r,
    // Only edges the user sees: hidden bypass edges are drawn only where they attach to a stage box.
    crossings: countCrossings(
      r.edges
        .filter(e => !e.hidden || e.layoutSrc !== e.src || e.layoutDest !== e.dest)
        .map(e => ({ src: e.layoutSrc, dest: e.layoutDest, points: e.points }))
    )
  };
}

// Measured crossings (legacy / elk): simple 0/0, complex 0/0, misordered 3/3, joins 3/3, stages 0/0,
// collapsed 0/0. The absolute budgets that outlive Ember are in layout/crossings-budget.test.ts.
// Legacy = grid cells joined by straight lines, from app/utils/graph-tools.js run as-is.
describe('edge crossings: ELK layout vs the legacy Ember layout', () => {
  it.each(CASES)('$name: no more crossings than the legacy layout', async c => {
    const old = legacyLayout(c.graph, { stages: c.stages, collapsedStages: new Set(c.collapsed ?? []) });
    const oldCrossings = countCrossings(old.polylines);
    const { crossings } = await newLayout(c);
    expect(crossings).toBeLessThanOrEqual(oldCrossings);
  });
});

describe('canvas size: ELK layout vs the legacy Ember layout', () => {
  it.each(CASES)('$name', async c => {
    const old = legacyLayout(c.graph, { stages: c.stages, collapsedStages: new Set(c.collapsed ?? []) });
    const { result } = await newLayout(c);
    const area = result.width * result.height;
    const oldArea = old.width * old.height;
    // Measured area ratios (elk / legacy): simple 1.25, complex 1.79, misordered 1.29, joins 1.84,
    // stages 1.09, collapsed 1.08. ELK nodes carry their label inside the box (legacy: icon plus
    // caption), so some growth is expected; the budget keeps it from drifting.
    expect(area).toBeLessThanOrEqual(oldArea * 2.5);
  });
});
