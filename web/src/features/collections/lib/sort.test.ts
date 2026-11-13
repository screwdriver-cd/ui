import { formatMetrics } from './metrics';
import { sortPipelines, type SortablePipeline } from './sort';

const metric = (over: Record<string, unknown> = {}) => ({
  createTime: '2019-03-12T01:09:55.973Z',
  status: 'SUCCESS',
  duration: 1144,
  sha: '3deb58c4059220c9e5ae92f3ccd1609aa36e47e7',
  commit: { message: 'Fix', url: 'https://github.com/x/y/commit/3deb' },
  ...over
});

describe('sortPipelines', () => {
  const item = (name: string, status: string | null, duration = 0, failed = 0): SortablePipeline => ({
    pipeline: { id: name.length, scmRepo: { name, branch: 'main', url: '' } },
    last: status ? formatMetrics([metric({ status: status.toUpperCase(), duration })]).lastEventInfo : undefined,
    failedBuildCount: failed
  });
  const names = (items: SortablePipeline[]) => items.map(i => i.pipeline.scmRepo.name);

  it('sorts by name regardless of loaded metrics', () => {
    expect(names(sortPipelines([item('b', null), item('a', 'success')], 'pipelineName', 'asc'))).toEqual(['a', 'b']);
    expect(names(sortPipelines([item('a', null), item('b', null)], 'pipelineName', 'desc'))).toEqual(['b', 'a']);
  });

  it('sorts by status priority and keeps pipelines without events last', () => {
    const list = [item('x', 'failure'), item('y', null), item('z', 'success')];

    expect(names(sortPipelines(list, 'lastRunStatus', 'asc'))).toEqual(['z', 'x', 'y']);
    expect(names(sortPipelines(list, 'lastRunStatus', 'desc'))).toEqual(['x', 'z', 'y']);
  });

  it('sorts by duration and failed build count', () => {
    expect(names(sortPipelines([item('a', 'success', 50), item('b', 'success', 5)], 'duration', 'asc'))).toEqual(['b', 'a']);
    expect(names(sortPipelines([item('a', 'success', 1, 3), item('b', 'success', 1, 1)], 'history', 'asc'))).toEqual(['b', 'a']);
  });
});
