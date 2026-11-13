import type { Build, WorkflowGraph } from '../types';
import { failedUpstreamJobs } from './upstream';

const graph: WorkflowGraph = {
  nodes: [
    { name: '~commit' },
    { name: 'a', id: 1 },
    { name: 'b', id: 2 },
    { name: 'c', id: 3 },
    { name: 'x', id: 4 }
  ],
  edges: [
    { src: '~commit', dest: 'a' },
    { src: 'a', dest: 'b' },
    { src: 'b', dest: 'c' },
    { src: 'x', dest: 'c' }
  ]
};
const build = (id: number, jobId: number, status: string) =>
  ({ id, jobId, status, createTime: '' } as Build);

describe('failedUpstreamJobs', () => {
  it('reports failed jobs anywhere upstream, not the job itself or downstream', () => {
    const builds = [
      build(1, 1, 'FAILURE'),
      build(2, 2, 'SUCCESS'),
      build(3, 3, 'FAILURE'),
      build(4, 4, 'ABORTED')
    ];

    expect(failedUpstreamJobs(graph, 'c', builds, []).sort()).toEqual([
      'a',
      'x'
    ]);
    expect(failedUpstreamJobs(graph, 'a', builds, [])).toEqual([]);
  });

  it('uses the latest build of a job and strips PR prefixes', () => {
    const builds = [build(1, 1, 'FAILURE'), build(5, 1, 'SUCCESS')];

    expect(failedUpstreamJobs(graph, 'b', builds, [])).toEqual([]);
    expect(
      failedUpstreamJobs(graph, 'PR-3:b', [build(1, 1, 'FAILURE')], [])
    ).toEqual(['a']);
  });

  it('maps builds through the jobs list when graph nodes carry no ids', () => {
    const bare: WorkflowGraph = {
      nodes: graph.nodes.map(({ name }) => ({ name })),
      edges: graph.edges
    };

    expect(
      failedUpstreamJobs(
        bare,
        'b',
        [build(1, 10, 'FAILURE')],
        [{ id: 10, name: 'PR-3:a' }]
      )
    ).toEqual(['a']);
  });

  it('is empty without a graph or builds', () => {
    expect(
      failedUpstreamJobs(undefined, 'a', [build(1, 1, 'FAILURE')], [])
    ).toEqual([]);
    expect(failedUpstreamJobs(graph, 'c', undefined, [])).toEqual([]);
  });
});
