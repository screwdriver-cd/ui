import { describe, expect, it } from 'vitest';
import type { DecoratedGraph, DecoratedNode, EventStage } from '../decorate';
import type { WorkflowEdge } from '../types';
import {
  COMPACT_SIZE,
  COMPACT_TRIGGER_SIZE,
  labelOf,
  NODE_HEIGHT,
  toLayoutInput,
  TRIGGER_HEIGHT
} from './input';

// 10px per character keeps the expected widths readable.
const measure = (text: string) => text.length * 10;

const graph = (
  nodes: DecoratedNode[],
  edges: Array<WorkflowEdge & { hidden?: boolean; status?: string }> = [],
  stages: Array<Pick<EventStage, 'name' | 'isCollapsed'>> = []
): DecoratedGraph => ({
  nodes,
  edges,
  stages: stages.map(s => ({ ...s, jobs: [], setup: null, teardown: null })),
  stageEdges: []
});

const sizes = (
  g: DecoratedGraph,
  options: Partial<Parameters<typeof toLayoutInput>[1]> = {}
) =>
  Object.fromEntries(
    toLayoutInput(g, { measure, ...options }).nodes.map(n => [
      n.id,
      [n.kind, n.width, n.height]
    ])
  );

describe('labelOf', () => {
  it('prefers a non-empty displayName, stringifying numbers', () => {
    expect(labelOf({ name: 'main', displayName: 'Main build' })).toBe(
      'Main build'
    );
    expect(labelOf({ name: 'main', displayName: 0 })).toBe('0');
    expect(labelOf({ name: 'main', displayName: '' })).toBe('main');
    expect(labelOf({ name: 'main' })).toBe('main');
  });
});

describe('toLayoutInput node sizes', () => {
  it('sizes jobs and external jobs from the label plus icon padding, clamped to 112..280', () => {
    const g = graph([
      { name: 'main' },
      { name: 'abcdefghij' },
      { name: 'x'.repeat(30) },
      { name: 'sd@1:abcdefghij' },
      { name: 'j', displayName: 'abcdefghijk' }
    ]);

    expect(sizes(g)).toEqual({
      main: ['job', 112, NODE_HEIGHT],
      abcdefghij: ['job', 156, NODE_HEIGHT],
      ['x'.repeat(30)]: ['job', 280, NODE_HEIGHT],
      'sd@1:abcdefghij': ['external', 206, NODE_HEIGHT],
      j: ['job', 166, NODE_HEIGHT]
    });
  });

  it('sizes triggers from the label, clamped to 80..280, and downstream summaries at a fixed size', () => {
    const g = graph([
      { name: '~pr' },
      { name: '~commit:release-branch' },
      { name: '~sd-main-triggers' }
    ]);

    expect(sizes(g)).toEqual({
      '~pr': ['trigger', 80, TRIGGER_HEIGHT],
      '~commit:release-branch': ['trigger', 252, TRIGGER_HEIGHT],
      '~sd-main-triggers': ['downstream', 150, 36]
    });
  });

  it('widens AND and OR join targets for their badge, raising the max width too', () => {
    const g = graph(
      [
        { name: 'a' },
        { name: 'b' },
        { name: 'and' },
        { name: 'or' },
        { name: 'y'.repeat(30) }
      ],
      [
        { src: 'a', dest: 'and', join: true },
        { src: 'b', dest: 'and', join: true },
        { src: 'a', dest: 'or' },
        { src: 'b', dest: 'or' },
        { src: 'a', dest: 'y'.repeat(30), join: true },
        { src: 'b', dest: 'y'.repeat(30), join: true }
      ]
    );
    const s = sizes(g);

    // Label + padding (86 / 76) is under the 112 minimum without a badge; the badge is added before clamping.
    expect(s.and).toEqual(['job', 30 + 56 + 64, NODE_HEIGHT]);
    expect(s.or).toEqual(['job', 20 + 56 + 40, NODE_HEIGHT]);
    expect(s.a).toEqual(['job', 112, NODE_HEIGHT]);
    expect(s['y'.repeat(30)]).toEqual(['job', 280 + 64, NODE_HEIGHT]);
  });

  it('ignores self loops and edges from unknown nodes when detecting joins', () => {
    const g = graph(
      [{ name: 'a' }, { name: 'x' }],
      [
        { src: 'a', dest: 'x', join: true },
        { src: 'ghost', dest: 'x', join: true },
        { src: 'x', dest: 'x', join: true }
      ]
    );

    expect(sizes(g).x).toEqual(['job', 112, NODE_HEIGHT]);
  });

  it('uses fixed icon-only sizes without labels, except for downstream summaries', () => {
    const g = graph([
      { name: 'a-long-job-name' },
      { name: '~commit' },
      { name: '~sd-a-triggers' }
    ]);

    expect(sizes(g, { showLabels: false })).toEqual({
      'a-long-job-name': ['job', NODE_HEIGHT, NODE_HEIGHT],
      '~commit': ['trigger', 32, TRIGGER_HEIGHT],
      '~sd-a-triggers': ['downstream', 150, 36]
    });
  });

  it('widens an icon-only join node by its badge', () => {
    const g = graph(
      [{ name: 'a' }, { name: 'b' }, { name: 'and' }, { name: 'or' }],
      [
        { src: 'a', dest: 'and', join: true },
        { src: 'b', dest: 'and', join: true },
        { src: 'a', dest: 'or' },
        { src: 'b', dest: 'or' }
      ]
    );
    const s = sizes(g, { showLabels: false });

    expect(s.and).toEqual(['job', NODE_HEIGHT + 64, NODE_HEIGHT]);
    expect(s.or).toEqual(['job', NODE_HEIGHT + 40, NODE_HEIGHT]);
    expect(s.a).toEqual(['job', NODE_HEIGHT, NODE_HEIGHT]);
  });

  it('uses tiny sizes in compact mode for every kind and marks the input compact', () => {
    const g = graph([
      { name: 'main' },
      { name: '~commit' },
      { name: '~sd-main-triggers' },
      { name: 'g', type: 'JOB_GROUP' }
    ]);
    const input = toLayoutInput(g, { measure, compact: true });

    expect(input.compact).toBe(true);
    expect(input.nodes.map(n => [n.id, n.width, n.height])).toEqual([
      ['main', COMPACT_SIZE, COMPACT_SIZE],
      ['~commit', COMPACT_TRIGGER_SIZE, COMPACT_TRIGGER_SIZE],
      ['~sd-main-triggers', COMPACT_SIZE, COMPACT_SIZE],
      ['g', COMPACT_SIZE, COMPACT_SIZE]
    ]);
    expect(toLayoutInput(g, { measure })).not.toHaveProperty('compact');
  });
});

describe('toLayoutInput edges', () => {
  it('drops self loops and dangling edges, keeps only the layout fields and the hidden flag', () => {
    const g = graph(
      [{ name: 'a', status: 'RUNNING', buildId: 9 }, { name: 'b' }],
      [
        { src: 'a', dest: 'b', status: 'SUCCESS', join: true },
        { src: 'b', dest: 'a', hidden: true },
        { src: 'a', dest: 'a' },
        { src: 'a', dest: 'missing' },
        { src: 'missing', dest: 'b', hidden: false }
      ]
    );
    const input = toLayoutInput(g, { measure });

    expect(input.edges).toEqual([
      { id: 'a->b', src: 'a', dest: 'b' },
      { id: 'b->a', src: 'b', dest: 'a', hidden: true }
    ]);
    expect(input.nodes[0]).toEqual({
      id: 'a',
      kind: 'job',
      width: 112,
      height: NODE_HEIGHT
    });
  });
});

describe('toLayoutInput stages', () => {
  it('places jobs only in expanded stages and lists expanded stages that have jobs', () => {
    const g = graph(
      [
        { name: 'ci-deploy', stageName: 'integration' },
        { name: 'ci-test', stageName: 'integration' },
        { name: 'prod-deploy', stageName: 'production' },
        {
          name: 'stage@production jobs (1)',
          stageName: 'production',
          type: 'JOB_GROUP'
        },
        { name: 'canary-job', stageName: 'canary' },
        { name: 'orphan', stageName: 'unknown' }
      ],
      [],
      [
        { name: 'integration', isCollapsed: false },
        { name: 'production', isCollapsed: true },
        { name: 'empty', isCollapsed: false },
        { name: 'canary', isCollapsed: false }
      ]
    );
    const input = toLayoutInput(g, { measure });
    const stageOf = Object.fromEntries(input.nodes.map(n => [n.id, n.stage]));

    expect(stageOf).toEqual({
      'ci-deploy': 'integration',
      'ci-test': 'integration',
      'prod-deploy': undefined,
      'stage@production jobs (1)': undefined,
      'canary-job': 'canary',
      orphan: undefined
    });
    expect(input.nodes.find(n => n.id === 'prod-deploy')).not.toHaveProperty(
      'stage'
    );
    expect(input.stages).toEqual([
      { name: 'integration', jobIds: ['ci-deploy', 'ci-test'] },
      { name: 'canary', jobIds: ['canary-job'] }
    ]);
  });

  it('never puts a JOB_GROUP node inside a stage, even one marked expanded', () => {
    const g = graph(
      [{ name: 'stage@a jobs (2)', stageName: 'a', type: 'JOB_GROUP' }],
      [],
      [{ name: 'a', isCollapsed: false }]
    );
    const input = toLayoutInput(g, { measure });

    expect(input.nodes[0]).toMatchObject({ kind: 'stage-group' });
    expect(input.nodes[0]).not.toHaveProperty('stage');
    expect(input.stages).toEqual([]);
  });
});
