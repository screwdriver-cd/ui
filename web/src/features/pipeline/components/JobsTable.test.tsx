import type { Build, Job, WorkflowGraph } from '../types';
import { buildRows } from './JobsTable';

const job = (id: number, name: string, extra: Partial<Job> = {}): Job =>
  ({
    id,
    name,
    pipelineId: 1,
    state: 'ENABLED',
    permutations: [{ annotations: {} }],
    ...extra
  } as Job);
const graph: WorkflowGraph = {
  nodes: [{ name: 'main' }, { name: 'test' }, { name: 'publish' }],
  edges: [
    { src: 'main', dest: 'test' },
    { src: 'test', dest: 'publish' }
  ]
};
const jobs = [
  job(3, 'publish'),
  job(1, 'main'),
  job(2, 'test'),
  job(4, 'old', { archived: true })
];
const builds = [
  { id: 10, jobId: 1, status: 'SUCCESS' },
  { id: 11, jobId: 2, status: 'FAILURE' }
] as Build[];

describe('buildRows', () => {
  it('orders jobs topologically and joins builds', () => {
    const rows = buildRows(jobs.slice(0, 3), builds, graph);

    expect(rows.map(r => r.displayName)).toEqual(['main', 'test', 'publish']);
    expect(rows.map(r => r.status)).toEqual(['SUCCESS', 'FAILURE', 'CREATED']);
  });

  it('keeps the latest build of a job', () => {
    const rows = buildRows(
      [job(1, 'main')],
      [
        { id: 5, jobId: 1, status: 'FAILURE' },
        { id: 9, jobId: 1, status: 'SUCCESS' }
      ] as Build[],
      graph
    );

    expect(rows[0]?.build?.id).toBe(9);
  });

  it('strips the PR prefix', () => {
    const rows = buildRows([job(1, 'PR-7:main')], [], graph, 7);

    expect(rows[0]?.displayName).toBe('main');
  });
});
