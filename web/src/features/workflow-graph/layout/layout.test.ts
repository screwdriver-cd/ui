import { describe, expect, it, beforeEach } from 'vitest';
import { decorateGraph } from '../decorate';
import type { DecoratedGraph } from '../decorate';
import { clearLayoutCache, computeLayout } from './client';
import { layoutKey, toLayoutInput } from './input';
import { createTextMeasurer } from './measure';
import type { LayoutResult } from './types';
import {
  COMPLEX_GRAPH,
  CYCLE_GRAPH,
  JOIN_GRAPH,
  MIXED_ROOTS_GRAPH,
  MIXED_ROOTS_JOBS,
  MIXED_ROOTS_STAGES,
  ONLY_DETACHED_GRAPH,
  MORE_COMPLEX_GRAPH,
  SIMPLE_GRAPH,
  STAGES,
  RELEASE_GRAPH,
  RELEASE_JOBS,
  RELEASE_STAGES,
  STAGES_GRAPH,
  STAGE_JOBS
} from '../fixtures/graphs';
import { stressGraph } from '../fixtures/stress';
import type { WorkflowGraphData } from '../types';

const measure = createTextMeasurer();

const prStages = {
  graph: {
    nodes: [
      { name: '~pr' },
      {
        name: 'stage@integration:setup',
        id: 14,
        stageName: 'integration',
        virtual: true
      },
      { name: 'ci-deploy', id: 11, stageName: 'integration' },
      { name: 'ci-test', id: 12, stageName: 'integration' },
      {
        name: 'stage@integration:teardown',
        id: 15,
        stageName: 'integration',
        virtual: true
      }
    ],
    edges: [
      { src: '~pr', dest: 'stage@integration:setup' },
      { src: 'stage@integration:setup', dest: 'ci-deploy' },
      { src: 'ci-deploy', dest: 'ci-test' },
      { src: 'ci-test', dest: 'stage@integration:teardown' }
    ]
  },
  stages: [
    { id: 5, name: 'integration' },
    { id: 10, name: 'PR-123:integration' }
  ],
  prNum: 123
};

const external: WorkflowGraphData = {
  nodes: [
    { name: '~commit' },
    { name: 'main' },
    { name: 'sd@123:ext' },
    { name: '~sd@456:up' },
    { name: '~sd-main-triggers', triggers: ['~sd@9:x'] },
    { name: 'detachedあいう', displayName: 'ビルドとテスト（日本語）' }
  ],
  edges: [
    { src: '~commit', dest: 'main' },
    { src: 'main', dest: 'sd@123:ext' },
    { src: '~sd@456:up', dest: 'sd@123:ext' },
    { src: 'main', dest: '~sd-main-triggers' }
  ]
};

const dec = (graph: WorkflowGraphData, extra: object = {}): DecoratedGraph =>
  decorateGraph({ graph, ...extra });

const cases: Array<[string, () => DecoratedGraph]> = [
  ['simple', () => dec(SIMPLE_GRAPH)],
  ['complex', () => dec(COMPLEX_GRAPH)],
  ['misordered + detached + remote triggers', () => dec(MORE_COMPLEX_GRAPH)],
  ['joins', () => dec(JOIN_GRAPH)],
  [
    'stages',
    () =>
      dec(STAGES_GRAPH, {
        stages: STAGES,
        collapsedStages: new Set(),
        jobs: STAGE_JOBS
      })
  ],
  [
    'collapsed stage',
    () =>
      dec(STAGES_GRAPH, {
        stages: STAGES,
        collapsedStages: new Set(['production']),
        jobs: STAGE_JOBS
      })
  ],
  [
    'all collapsed',
    () =>
      dec(STAGES_GRAPH, {
        stages: STAGES,
        collapsedStages: new Set(['production', 'integration']),
        jobs: STAGE_JOBS
      })
  ],
  [
    'release (parallel chains, detached stage)',
    () =>
      dec(RELEASE_GRAPH, {
        stages: RELEASE_STAGES,
        collapsedStages: new Set(),
        jobs: RELEASE_JOBS
      })
  ],
  [
    'release, integration collapsed',
    () =>
      dec(RELEASE_GRAPH, {
        stages: RELEASE_STAGES,
        collapsedStages: new Set(['integration']),
        jobs: RELEASE_JOBS
      })
  ],
  [
    'pr stages',
    () =>
      dec(prStages.graph, {
        stages: prStages.stages,
        collapsedStages: new Set(),
        prNum: prStages.prNum
      })
  ],
  ['external + downstream triggers + CJK', () => dec(external)],
  ['only detached', () => dec(ONLY_DETACHED_GRAPH)],
  [
    'mixed roots',
    () =>
      dec(MIXED_ROOTS_GRAPH, {
        stages: MIXED_ROOTS_STAGES,
        collapsedStages: new Set(),
        jobs: MIXED_ROOTS_JOBS
      })
  ],
  ['cycle + rootless component', () => dec(CYCLE_GRAPH)]
];

type Rect = { id: string; x: number; y: number; width: number; height: number };

const overlap = (a: Rect, b: Rect) =>
  a.x < b.x + b.width - 0.01 &&
  b.x < a.x + a.width - 0.01 &&
  a.y < b.y + b.height - 0.01 &&
  b.y < a.y + a.height - 0.01;

function checkInvariants(r: LayoutResult) {
  const stageRects = r.stages;
  const topLevel: Rect[] = [...r.nodes.filter(n => !n.parentId), ...stageRects];

  // no overlap among top-level boxes
  topLevel.forEach((a, i) => {
    topLevel.slice(i + 1).forEach(b => {
      if (overlap(a, b)) throw new Error(`overlap: ${a.id} / ${b.id}`);
    });
  });

  // no overlap among nodes inside the same stage; children inside stage bounds
  stageRects.forEach(s => {
    const kids = r.nodes.filter(n => n.parentId === s.id);

    kids.forEach((k, i) => {
      if (
        k.x < s.x ||
        k.y < s.y ||
        k.x + k.width > s.x + s.width ||
        k.y + k.height > s.y + s.height
      ) {
        throw new Error(`child ${k.id} outside ${s.id}`);
      }

      kids.slice(i + 1).forEach(o => {
        if (overlap(k, o))
          throw new Error(`overlap in stage: ${k.id} / ${o.id}`);
      });
    });
  });

  // edges go left to right unless flagged as back-edges
  const rect = new Map<string, Rect>(
    [...r.nodes, ...stageRects].map(n => [n.id, n])
  );

  r.edges.forEach(e => {
    const s = rect.get(e.layoutSrc) as Rect;
    const d = rect.get(e.layoutDest) as Rect;

    expect(s, `src of ${e.id}`).toBeDefined();
    expect(d, `dest of ${e.id}`).toBeDefined();
    if (!e.backward && e.layoutSrc !== e.layoutDest) {
      expect(d.x, `edge ${e.id} must go left to right`).toBeGreaterThanOrEqual(
        s.x + s.width - 0.5
      );
    }
  });

  expect(r.width).toBeGreaterThan(0);
  checkLeftJustified(topLevel);
  stageRects.forEach(s =>
    checkLeftJustified(r.nodes.filter(n => n.parentId === s.id))
  );
}

/**
 * Boxes of one layer share their left edge. Layers are the groups of boxes whose x ranges overlap
 * (different layers are separated by the between-layer spacing).
 */
function checkLeftJustified(boxes: Rect[]) {
  const sorted = [...boxes].sort((a, b) => a.x - b.x);
  let layer: Rect[] = [];
  let right = -Infinity;
  const flush = () => {
    layer.forEach(b => {
      if (Math.abs(b.x - (layer[0] as Rect).x) > 0.5) {
        throw new Error(
          `layer not left-justified: ${b.id} x=${b.x} vs ${
            (layer[0] as Rect).id
          } x=${(layer[0] as Rect).x}`
        );
      }
    });
  };

  sorted.forEach(b => {
    if (layer.length && b.x >= right - 0.5) {
      flush();
      layer = [];
      right = -Infinity;
    }
    layer.push(b);
    right = Math.max(right, b.x + b.width);
  });
  if (layer.length) flush();
}

const segments = (pts: Array<{ x: number; y: number }>) =>
  pts.slice(1).map((p, i) => [pts[i] as { x: number; y: number }, p] as const);

beforeEach(() => clearLayoutCache());

describe('root row order: ~pr, ~commit, other triggers, then detached', () => {
  const topY = (r: LayoutResult, id: string) => {
    const n = r.nodes.find(x => x.id === id) as Rect;

    return (r.stages.find(s => s.id === id) ?? n).y;
  };

  it('stacks ~pr, ~commit, then detached jobs in name order', async () => {
    const r = await computeLayout(
      toLayoutInput(dec(ONLY_DETACHED_GRAPH), { measure })
    );
    const ys = ['~pr', '~commit', 'd1', 'd2', 'd3'].map(id => topY(r, id));

    expect(ys).toEqual([...ys].sort((a, b) => a - b));
    expect(new Set(ys).size).toBe(5);
    expect(topY(r, 'pull')).toBeCloseTo(topY(r, '~pr') + 6, -2);
  });

  it('puts all triggers before the detached job and the detached stage', async () => {
    const r = await computeLayout(
      toLayoutInput(
        dec(MIXED_ROOTS_GRAPH, {
          stages: MIXED_ROOTS_STAGES,
          collapsedStages: new Set(),
          jobs: MIXED_ROOTS_JOBS
        }),
        { measure }
      )
    );
    const ids = [
      '~pr',
      '~commit',
      '~tag',
      '~sd@456:up',
      'detached-job',
      'stage:solo'
    ];
    const ys = ids.map(id => topY(r, id));

    expect(ys[0]).toBeLessThan(ys[1] as number);
    expect(ys[1]).toBeLessThan(Math.min(ys[2] as number, ys[3] as number));
    expect(Math.max(ys[2] as number, ys[3] as number)).toBeLessThan(
      Math.min(ys[4] as number, ys[5] as number)
    );
    // detached items keep definition order (the stage is listed before the job)
    expect(ys[5]).toBeLessThan(ys[4] as number);
  });
});

describe('branch trigger variants', () => {
  const topY = (r: LayoutResult, id: string) =>
    (r.nodes.find(x => x.id === id) as { y: number }).y;

  it('rank directly after the plain trigger they refine', async () => {
    const graph: WorkflowGraphData = {
      nodes: [
        { name: '~commit:release' },
        { name: '~pr:main' },
        { name: '~tag' },
        { name: '~commit' },
        { name: '~pr' },
        { name: 'a', id: 1 },
        { name: 'b', id: 2 },
        { name: 'c', id: 3 },
        { name: 'd', id: 4 },
        { name: 'e', id: 5 }
      ],
      edges: [
        { src: '~pr', dest: 'a' },
        { src: '~pr:main', dest: 'b' },
        { src: '~commit', dest: 'c' },
        { src: '~commit:release', dest: 'd' },
        { src: '~tag', dest: 'e' }
      ]
    };
    const jobs = graph.nodes
      .filter(n => n.id !== undefined)
      .map(n => ({ id: n.id as number, name: n.name }));
    const r = await computeLayout(
      toLayoutInput(
        dec(graph, { stages: [], collapsedStages: new Set(), jobs }),
        { measure }
      )
    );
    const ids = ['~pr', '~pr:main', '~commit', '~commit:release', '~tag'];
    const ys = ids.map(id => topY(r, id));

    expect(ys).toEqual([...ys].sort((a, b) => a - b));
    expect(new Set(ys).size).toBe(5);
  });
});

describe('layout invariants', () => {
  it.each(cases)('%s', async (_name, make) => {
    const graph = make();
    const input = toLayoutInput(graph, { measure });
    const r = await computeLayout(input);

    expect(r.nodes).toHaveLength(graph.nodes.length);
    checkInvariants(r);
  });

  it('puts expanded stage jobs inside a stage box and collapsed stages in a single node', async () => {
    const expanded = await computeLayout(
      toLayoutInput(
        dec(STAGES_GRAPH, {
          stages: STAGES,
          collapsedStages: new Set(),
          jobs: STAGE_JOBS
        }),
        { measure }
      )
    );

    expect(expanded.stages.map(s => s.name)).toEqual([
      'integration',
      'production'
    ]);
    expect(
      expanded.nodes
        .filter(n => n.parentId === 'stage:integration')
        .map(n => n.id)
    ).toEqual(['ci-deploy', 'ci-test', 'ci-certify']);

    const collapsed = await computeLayout(
      toLayoutInput(
        dec(STAGES_GRAPH, {
          stages: STAGES,
          collapsedStages: new Set(['production']),
          jobs: STAGE_JOBS
        }),
        { measure }
      )
    );

    expect(collapsed.stages.map(s => s.name)).toEqual(['integration']);
    expect(
      collapsed.nodes.some(
        n => n.id === 'stage@production jobs (3)' && !n.parentId
      )
    ).toBe(true);
  });

  it('attaches hidden bypass edges to the stage box', async () => {
    const r = await computeLayout(
      toLayoutInput(
        dec(STAGES_GRAPH, {
          stages: STAGES,
          collapsedStages: new Set(),
          jobs: STAGE_JOBS
        }),
        { measure }
      )
    );
    const e = r.edges.find(x => x.id === 'publish->ci-deploy');

    expect(e).toMatchObject({
      layoutSrc: 'publish',
      layoutDest: 'stage:integration',
      hidden: true
    });
    expect(
      r.edges.find(x => x.id === 'ci-certify->stage@production:setup')
    ).toMatchObject({
      layoutSrc: 'stage:integration',
      layoutDest: 'stage:production'
    });
  });

  it('lays stages out hierarchically in one pass: stage boxes size around jobs and inner edges are routed inside', async () => {
    const r = await computeLayout(
      toLayoutInput(
        dec(STAGES_GRAPH, {
          stages: STAGES,
          collapsedStages: new Set(),
          jobs: STAGE_JOBS
        }),
        { measure }
      )
    );
    const box = r.stages.find(s => s.name === 'integration') as Rect;
    const inner = r.edges.find(e => e.id === 'ci-deploy->ci-test');

    expect(inner?.points.length).toBeGreaterThanOrEqual(2);
    inner?.points.forEach(p => {
      expect(p.x).toBeGreaterThanOrEqual(box.x);
      expect(p.x).toBeLessThanOrEqual(box.x + box.width);
      expect(p.y).toBeGreaterThanOrEqual(box.y);
      expect(p.y).toBeLessThanOrEqual(box.y + box.height);
    });
    // jobs keep ELK's stage padding (header room on top)
    const kids = r.nodes.filter(n => n.parentId === 'stage:integration');

    expect(Math.min(...kids.map(k => k.y)) - box.y).toBeGreaterThanOrEqual(40);
  });

  it('left-justifies triggers and the detached stage that share the first layer', async () => {
    const graph = dec(RELEASE_GRAPH, {
      stages: RELEASE_STAGES,
      collapsedStages: new Set(),
      jobs: RELEASE_JOBS
    });
    const r = await computeLayout(toLayoutInput(graph, { measure }));
    const x = (id: string) =>
      (r.nodes.find(n => n.id === id) ?? r.stages.find(s => s.id === id))
        ?.x as number;
    const wide = r.stages.find(s => s.name === 'detached') as Rect;

    expect(wide.width).toBeGreaterThan(150);
    expect(x('~pr')).toBeCloseTo(x('stage:detached'), 0);
    expect(x('~commit')).toBeCloseTo(x('stage:detached'), 0);
    // the two parallel chains inside production line up column by column
    expect(x('prod-green-deploy')).toBeCloseTo(x('prod-blue-deploy'), 0);
    expect(x('prod-green-test')).toBeCloseTo(x('prod-blue-test'), 0);
    expect(x('prod-green-certify')).toBeCloseTo(x('prod-blue-certify'), 0);
  });

  it('routes short orthogonal edges around the production stage (no detours through nodes)', async () => {
    const graph = dec(RELEASE_GRAPH, {
      stages: RELEASE_STAGES,
      collapsedStages: new Set(),
      jobs: RELEASE_JOBS
    });
    const r = await computeLayout(toLayoutInput(graph, { measure }));
    const box = new Map<string, Rect>(
      [...r.nodes, ...r.stages].map(n => [n.id, n])
    );
    const prod = r.nodes.filter(n => n.parentId === 'stage:production');
    const tolerance = 1;

    r.edges
      .filter(e => e.points.length >= 2)
      .forEach(e => {
        const segs = segments(e.points);
        const length = segs.reduce(
          (a, [p, q]) => a + Math.abs(p.x - q.x) + Math.abs(p.y - q.y),
          0
        );
        const s = box.get(e.layoutSrc) as Rect;
        const d = box.get(e.layoutDest) as Rect;
        const direct =
          Math.abs(d.x - (s.x + s.width)) +
          Math.abs(d.y + d.height / 2 - (s.y + s.height / 2));

        // axis-aligned segments only
        segs.forEach(([p, q]) =>
          expect(p.x === q.x || p.y === q.y, `${e.id} diagonal`).toBe(true)
        );
        // never longer than twice the direct distance (plus the jog allowance), so no loops
        if (!e.backward)
          expect(length, e.id).toBeLessThanOrEqual(2 * direct + 60);
        // starts on the source's right side and ends on the destination's left side
        const first = e.points[0] as { x: number; y: number };
        const last = e.points[e.points.length - 1] as { x: number; y: number };

        expect(
          Math.abs(first.x - (s.x + s.width)),
          `${e.id} leaves source right`
        ).toBeLessThanOrEqual(tolerance);
        expect(
          Math.abs(last.x - d.x),
          `${e.id} enters dest left`
        ).toBeLessThanOrEqual(tolerance);
      });

    // edges inside production never cross a node that is not one of their endpoints
    r.edges
      .filter(
        e =>
          e.points.length >= 2 &&
          e.layoutSrc !== e.layoutDest &&
          prod.some(n => n.id === e.src)
      )
      .forEach(e => {
        prod
          .filter(n => n.id !== e.src && n.id !== e.dest)
          .forEach(n => {
            segments(e.points).forEach(([p, q]) => {
              const hit =
                Math.max(p.x, q.x) > n.x + 0.5 &&
                Math.min(p.x, q.x) < n.x + n.width - 0.5 &&
                Math.max(p.y, q.y) > n.y + 0.5 &&
                Math.min(p.y, q.y) < n.y + n.height - 0.5;

              expect(hit, `${e.id} crosses ${n.id}`).toBe(false);
            });
          });
      });

    // the AND join edges end at distinct points of the teardown node, not on top of each other
    const ends = r.edges
      .filter(e => e.dest === 'stage@production:teardown')
      .map(e => (e.points[e.points.length - 1] as { y: number }).y);

    expect(new Set(ends.map(Math.round)).size).toBe(ends.length);
  });

  it('flags cycle back-edges instead of looping', async () => {
    const r = await computeLayout(toLayoutInput(dec(CYCLE_GRAPH), { measure }));

    expect(r.edges.some(e => e.backward)).toBe(true);
    expect(r.edges.filter(e => e.backward).length).toBeLessThan(r.edges.length);
  });

  it('sizes CJK labels wider than short latin ones', async () => {
    const r = await computeLayout(toLayoutInput(dec(external), { measure }));
    const w = (id: string) => r.nodes.find(n => n.id === id)?.width as number;

    expect(w('detachedあいう')).toBeGreaterThan(w('main'));
  });

  it('leaves room for the join badge next to the label', () => {
    const input = toLayoutInput(dec(JOIN_GRAPH), { measure });
    const w = (id: string) =>
      input.nodes.find(n => n.id === id)?.width as number;

    // deploy is an AND join, notify an OR join, t1 a plain node with a label of similar length
    expect(w('deploy')).toBeGreaterThan(w('t1'));
    expect(w('notify')).toBeGreaterThan(w('t1'));
    expect(w('deploy')).toBeGreaterThan(w('notify'));
  });

  it('shrinks nodes without labels', () => {
    const withLabels = toLayoutInput(dec(external), { measure });
    const without = toLayoutInput(dec(external), {
      measure,
      showLabels: false
    });

    expect(without.nodes.find(n => n.id === 'main')?.width).toBeLessThan(
      withLabels.nodes.find(n => n.id === 'main')?.width as number
    );
    expect(layoutKey(without)).not.toBe(layoutKey(withLabels));
  });
});

describe('layout stability', () => {
  it('is unchanged when only statuses and builds change', async () => {
    const make = (status: string, buildId: number) =>
      dec(STAGES_GRAPH, {
        stages: STAGES,
        collapsedStages: new Set(),
        jobs: STAGE_JOBS,
        builds: [
          { id: buildId, jobId: 21, status },
          { id: buildId + 1, jobId: 1, status }
        ],
        start: '~commit'
      });
    const a = toLayoutInput(make('RUNNING', 1), { measure });
    const b = toLayoutInput(make('SUCCESS', 7), { measure });

    expect(layoutKey(a)).toBe(layoutKey(b));

    const ra = await computeLayout(a);

    clearLayoutCache();

    const rb = await computeLayout(b);

    expect(rb).toEqual(ra);
  });

  it('returns the cached result for an identical key and changes when collapsed state changes', async () => {
    const open = toLayoutInput(
      dec(STAGES_GRAPH, {
        stages: STAGES,
        collapsedStages: new Set(),
        jobs: STAGE_JOBS
      }),
      { measure }
    );
    const closed = toLayoutInput(
      dec(STAGES_GRAPH, {
        stages: STAGES,
        collapsedStages: new Set(['integration']),
        jobs: STAGE_JOBS
      }),
      { measure }
    );

    expect(await computeLayout(open)).toBe(
      await computeLayout(structuredClone(open))
    );
    expect(layoutKey(open)).not.toBe(layoutKey(closed));
  });

  it('is deterministic', async () => {
    const input = toLayoutInput(dec(MORE_COMPLEX_GRAPH), { measure });
    const a = await computeLayout(input);

    clearLayoutCache();
    expect(await computeLayout(input)).toEqual(a);
  });
});

describe('stress', () => {
  it('lays out 300+ nodes with stages inside the time budget', async () => {
    const { graph, stageMeta } = stressGraph(8, 36);

    expect(graph.nodes.length).toBeGreaterThan(300);

    const d = dec(graph, { stages: stageMeta, collapsedStages: new Set() });
    const input = toLayoutInput(d, { measure });
    const t0 = performance.now();
    const r = await computeLayout(input);
    const ms = performance.now() - t0;

    checkInvariants(r);
    expect(r.nodes).toHaveLength(d.nodes.length);
    expect(r.stages).toHaveLength(8);
    expect(ms).toBeLessThan(15000);
  }, 30000);
});

describe('root order in a wide pipeline', () => {
  const detached = [
    'deploy-keda-ue1',
    'deploy-keda-uw2',
    'deploy-alb-ue1',
    'deploy-alb-uw2',
    'delete-expired-dev-buckets',
    'delete-dev-bucket',
    'delete-bucket',
    'teardown-old-canary-version',
    'kill-canary-pods',
    'deploy-keda-ase1',
    'kickoff-canary'
  ];
  const chains: Array<[string, string]> = [
    ['~pr', 'validate-semgrep'],
    ['~pr', 'test-pr'],
    ['~pr', 'tag-pr'],
    ['tag-pr', 'build-pr'],
    ['tag-pr', 'build-docs'],
    ['tag-pr', 'check-kpi-config'],
    ['build-pr', 'parse-pr-yaml'],
    ['parse-pr-yaml', 'docker-build-pr'],
    ['~commit', 'tag'],
    ['tag', 'build'],
    ['tag', 'publish-docs'],
    ['tag', 'checkov-scan-app'],
    ['build', 'docker-build'],
    ['docker-build-pr', 'distribute-pr'],
    ['docker-build', 'distribute'],
    ['distribute-pr', 'kickoff-bucket-v2'],
    ['distribute', 'kickoff-bucket-v2'],
    ['delete-bucket', 'get-latest'],
    ['get-latest', 'update-buckets'],
    ['update-buckets', 'kickoff-bucket-v2'],
    ['kickoff-canary', 'deploy-canary'],
    ['deploy-canary', 'kpi'],
    ['kpi', 'cmr-complete'],
    ['cmr-complete', 'schedule-deploy-prod']
  ];

  it.each([0, 3, 7, 12, 19])(
    'stacks ~pr then ~commit above every detached job (input rotated by %i)',
    async rot => {
      const names = new Set<string>(detached);

      chains.forEach(([a, b]) => {
        names.add(a);
        names.add(b);
      });
      const all = [
        ...detached.slice(0, 5),
        '~commit',
        ...detached.slice(5),
        ...[...names].filter(n => !detached.includes(n) && n !== '~commit')
      ];
      const nodes = all.map((name, i) =>
        name.startsWith('~') ? { name } : { name, id: i + 1 }
      );

      nodes.push(...nodes.splice(0, rot));
      const graph: WorkflowGraphData = {
        nodes,
        edges: chains.map(([src, dest]) => ({ src, dest }))
      };
      const jobs = nodes
        .filter(n => 'id' in n)
        .map(n => ({ id: (n as { id: number }).id, name: n.name }));
      const r = await computeLayout(
        toLayoutInput(
          dec(graph, { stages: [], collapsedStages: new Set(), jobs }),
          { measure }
        )
      );
      const y = (id: string) =>
        (r.nodes.find(x => x.id === id) as { y: number }).y;

      detached.forEach(d => {
        expect(y('~pr'), `~pr above ${d}`).toBeLessThan(y(d));
        expect(y('~commit'), `~commit above ${d}`).toBeLessThan(y(d));
      });
      expect(y('~pr')).toBeLessThan(y('~commit'));
    }
  );
});

describe('root order in random graphs', () => {
  const rng = (seed: number) => () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;

    return seed / 4294967296;
  };

  it.each([1, 2, 3, 4, 5, 6, 7, 8])(
    'keeps ~pr, ~commit, then other roots in order (seed %i)',
    async seed => {
      const rand = rng(seed);
      const names = [
        '~commit',
        'r-a',
        '~pr',
        'r-b',
        '~tag',
        'r-c',
        'r-d',
        'r-e',
        '~pr:main',
        ...Array.from({ length: 40 }, (_, i) => `j${i}`)
      ];
      const nodes = names.map((name, i) =>
        name.startsWith('~') ? { name } : { name, id: i + 1 }
      );
      const edges: Array<{ src: string; dest: string }> = [];
      const roots = names.slice(0, 9);
      const rest = names.slice(9);

      roots.forEach(r => {
        const n = 1 + Math.floor(rand() * 3);

        for (let k = 0; k < n; k++) {
          edges.push({
            src: r,
            dest: rest[Math.floor(rand() * rest.length)] as string
          });
        }
      });
      rest.forEach((d, i) => {
        if (i === 0) return;
        const n = 1 + Math.floor(rand() * 2);

        for (let k = 0; k < n; k++) {
          edges.push({
            src: rest[Math.floor(rand() * i)] as string,
            dest: d as string
          });
        }
      });
      const jobs = nodes
        .filter(n => 'id' in n)
        .map(n => ({ id: (n as { id: number }).id, name: n.name }));
      const r = await computeLayout(
        toLayoutInput(
          dec({ nodes, edges } as WorkflowGraphData, {
            stages: [],
            collapsedStages: new Set(),
            jobs
          }),
          { measure }
        )
      );
      const rootIds = names
        .slice(0, 9)
        .filter(n => !edges.some(e => e.dest === n));
      const order = (id: string) =>
        id === '~pr'
          ? 0
          : id === '~pr:main'
          ? 1
          : id === '~commit'
          ? 2
          : id.startsWith('~')
          ? 3
          : 4;
      const expected = [...rootIds].sort(
        (a, b) => order(a) - order(b) || names.indexOf(a) - names.indexOf(b)
      );
      const actual = [...rootIds].sort(
        (a, b) =>
          (r.nodes.find(x => x.id === a) as { y: number }).y -
          (r.nodes.find(x => x.id === b) as { y: number }).y
      );

      expect(actual).toEqual(expected);
    }
  );
});

describe('trigger centring', () => {
  it('levels ~pr and ~commit with the middle of the nodes they feed, keeping their order', async () => {
    const mk = (p: string, n: number) =>
      Array.from({ length: n }, (_, i) => `${p}${i}`);
    const prT = mk('pr-', 24);
    const cT = mk('c-', 12);
    const tail = mk('tail-', 8);
    const names = ['~pr', '~commit', ...prT, ...cT, ...tail, 'detached'];
    const edges = [
      ...prT.map(dest => ({ src: '~pr', dest })),
      ...cT.map(dest => ({ src: '~commit', dest })),
      ...prT
        .slice(0, 16)
        .map((src, i) => ({ src, dest: tail[i % 8] as string })),
      ...cT.map((src, i) => ({ src, dest: tail[(i + 3) % 8] as string }))
    ];
    const nodes = names.map((name, i) =>
      name.startsWith('~') ? { name } : { name, id: i + 1 }
    );
    const jobs = nodes
      .filter(n => 'id' in n)
      .map(n => ({ id: (n as { id: number }).id, name: n.name }));
    const r = await computeLayout(
      toLayoutInput(
        dec({ nodes, edges } as WorkflowGraphData, {
          stages: [],
          collapsedStages: new Set(),
          jobs
        }),
        { measure }
      )
    );
    const box = (id: string) =>
      r.nodes.find(x => x.id === id) as { y: number; height: number };
    const centre = (id: string) => box(id).y + box(id).height / 2;
    const mid = (ids: string[]) => {
      const tops = ids.map(id => box(id).y);
      const bottoms = ids.map(id => box(id).y + box(id).height);

      return (Math.min(...tops) + Math.max(...bottoms)) / 2;
    };

    expect(Math.abs(centre('~pr') - mid(prT))).toBeLessThanOrEqual(1);
    // ~commit is centred too, unless a neighbour is in the way: ~pr above it, or the first detached job below it.
    const prBottom = box('~pr').y + box('~pr').height;
    const centred = Math.abs(centre('~commit') - mid(cT)) <= 1;
    const packed = Math.abs(box('~commit').y - (prBottom + 20)) <= 1;

    const touchesBelow =
      Math.abs(
        box('detached').y - (box('~commit').y + box('~commit').height + 20)
      ) <= 1;

    expect(centred || packed || touchesBelow).toBe(true);
    expect(box('~pr').y + box('~pr').height).toBeLessThan(box('~commit').y);
    expect(box('~commit').y + box('~commit').height).toBeLessThan(
      box('detached').y
    );
    // Each trigger's edges still start on the trigger and end on their targets.
    r.edges
      .filter(e => e.src === '~pr' || e.src === '~commit')
      .forEach(e => {
        const first = e.points[0] as { y: number };
        const src = box(e.src);

        expect(first.y).toBeGreaterThanOrEqual(src.y - 0.5);
        expect(first.y).toBeLessThanOrEqual(src.y + src.height + 0.5);
      });
  });
});
