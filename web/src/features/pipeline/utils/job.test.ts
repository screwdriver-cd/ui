import type { Job, WorkflowGraph } from '../types';
import {
  getDisplayName,
  sortJobsTopologically,
  topologicalLevels
} from './job';

const graph: WorkflowGraph = {
  nodes: [
    { name: '~commit' },
    { name: 'main' },
    { name: 'test' },
    { name: 'publish' },
    { name: 'alone' }
  ],
  edges: [
    { src: '~commit', dest: 'main' },
    { src: 'main', dest: 'test' },
    { src: 'main', dest: 'publish' },
    { src: 'test', dest: 'publish' }
  ]
};

describe('topologicalLevels', () => {
  it('uses the longest path from a root', () => {
    const levels = topologicalLevels(graph);

    expect(levels.get('main')).toBe(1);
    expect(levels.get('test')).toBe(2);
    expect(levels.get('publish')).toBe(3);
  });

  it('survives cycles', () => {
    const cyclic: WorkflowGraph = {
      nodes: [{ name: 'a' }, { name: 'b' }],
      edges: [
        { src: 'a', dest: 'b' },
        { src: 'b', dest: 'a' }
      ]
    };

    expect(() => topologicalLevels(cyclic)).not.toThrow();
  });

  it('is empty without a graph', () => {
    expect(topologicalLevels(undefined).size).toBe(0);
  });
});

describe('sortJobsTopologically', () => {
  it('orders by level, then name, and puts unknown jobs last', () => {
    const names = sortJobsTopologically(
      [
        { name: 'zzz' },
        { name: 'publish' },
        { name: 'test' },
        { name: 'main' }
      ],
      graph
    ).map(j => j.name);

    expect(names).toEqual(['main', 'test', 'publish', 'zzz']);
  });
});

describe('getDisplayName', () => {
  it('strips the PR prefix and honours the displayName annotation', () => {
    const job = {
      name: 'PR-5:main',
      permutations: [{ annotations: {} }]
    } as unknown as Job;
    const named = {
      name: 'main',
      permutations: [{ annotations: { 'screwdriver.cd/displayName': 'Build' } }]
    } as unknown as Job;

    expect(getDisplayName(job, 5)).toBe('main');
    expect(getDisplayName(named)).toBe('Build');
  });
});
