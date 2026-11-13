import { beforeEach, describe, expect, it } from 'vitest';
import { decorateGraph } from '../decorate';
import {
  RELEASE_GRAPH,
  RELEASE_JOBS,
  RELEASE_STAGES,
  STAGES,
  STAGES_GRAPH,
  STAGE_JOBS
} from '../fixtures/graphs';
import { clearLayoutCache, computeLayout } from '../layout/client';
import { toLayoutInput } from '../layout/input';
import { createTextMeasurer } from '../layout/measure';
import { createLensContext } from '../lens';
import { polylinePath } from './edges';
import { buildFlow } from './flow';

const measure = createTextMeasurer();

beforeEach(() => clearLayoutCache());

async function flowOf(
  graph: typeof STAGES_GRAPH,
  stages: typeof STAGES,
  jobs: typeof STAGE_JOBS,
  collapsed: string[]
) {
  const decorated = decorateGraph({
    graph,
    stages,
    jobs,
    collapsedStages: new Set(collapsed)
  });
  const layout = await computeLayout(toLayoutInput(decorated, { measure }));

  return buildFlow({
    decorated,
    graph,
    layout,
    lensCtx: createLensContext({
      nodes: decorated.nodes,
      edges: decorated.edges,
      builds: []
    }),
    lens: null,
    pinned: null,
    activeTab: 'events',
    readOnly: false,
    showLabels: true,
    matches: null,
    stateFilter: null,
    stateFilterNodes: new Set()
  });
}

describe('collapsed stage edges', () => {
  it('draws the edge from the upstream job into the collapsed stage node', async () => {
    const { edges } = await flowOf(STAGES_GRAPH, STAGES, STAGE_JOBS, [
      'integration'
    ]);
    const group = 'stage@integration jobs (3)';

    expect(
      edges.find(e => e.source === 'publish' && e.target === group)
    ).toBeDefined();
    // outgoing edge into the (expanded) production stage box, still drawn
    expect(
      edges.find(e => e.source === group && e.target === 'stage:production')
    ).toBeDefined();
  });

  it('draws the collapsed stage in both directions when it is the last stage as well', async () => {
    const { edges } = await flowOf(STAGES_GRAPH, STAGES, STAGE_JOBS, [
      'integration',
      'production'
    ]);

    expect(
      edges.find(
        e => e.source === 'publish' && e.target === 'stage@integration jobs (3)'
      )
    ).toBeDefined();
    expect(
      edges.find(
        e =>
          e.source === 'stage@integration jobs (3)' &&
          e.target === 'stage@production jobs (3)'
      )
    ).toBeDefined();
  });

  it('does not draw hidden bypass edges between plain nodes', async () => {
    const { edges } = await flowOf(STAGES_GRAPH, STAGES, STAGE_JOBS, []);

    expect(
      edges.find(
        e => e.source === 'publish' && e.target === 'stage:integration'
      )
    ).toBeDefined();
    expect(
      edges.find(e => e.source === 'publish' && e.target === 'ci-deploy')
    ).toBeUndefined();
  });
});

describe('ELK routed edges', () => {
  it('carries the ELK route on each React Flow edge, using the custom edge type', async () => {
    const { edges } = await flowOf(
      RELEASE_GRAPH,
      RELEASE_STAGES,
      RELEASE_JOBS,
      []
    );

    expect(edges.length).toBeGreaterThan(10);
    edges.forEach(e => {
      expect(e.type).toBe('elk');
      expect(e.data?.points.length, e.id).toBeGreaterThanOrEqual(2);
    });
  });

  it('builds a rounded path through the bend points', () => {
    expect(
      polylinePath([
        { x: 0, y: 0 },
        { x: 40, y: 0 }
      ])
    ).toBe('M 0 0 L 40 0');
    expect(
      polylinePath([
        { x: 0, y: 0 },
        { x: 20, y: 0 },
        { x: 20, y: 30 }
      ])
    ).toBe('M 0 0 L 14 0 Q 20 0 20 6 L 20 30');
    expect(polylinePath([])).toBe('');
  });
});
