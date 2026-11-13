import type { Metric } from '../types';
import {
  buildBreakdown,
  categoricalColor,
  clampZoom,
  customRange,
  downtimeRows,
  eventRows,
  niceTicks,
  OTHER_COLOR,
  segmentAt,
  stepBreakdown,
  summarize,
  tickIndexes,
  timeRange,
  toDateInput
} from './metrics';

const metric = (over: Partial<Metric> & { id: number }): Metric => ({
  createTime: `2024-03-1${over.id}T00:00:00.000Z`,
  status: 'SUCCESS',
  duration: 120,
  queuedTime: 60,
  imagePullTime: 30,
  ...over
});

describe('timeRange', () => {
  const end = new Date('2024-03-14T09:30:45.000Z');

  it('computes each preset range back from the end time, to the minute', () => {
    expect(timeRange('6hr', end)).toEqual({ startTime: '2024-03-14T03:30', endTime: '2024-03-14T09:30' });
    expect(timeRange('1d', end)?.startTime).toBe('2024-03-13T09:30');
    expect(timeRange('1wk', end)?.startTime).toBe('2024-03-07T09:30');
    expect(timeRange('1mo', end)?.startTime).toBe('2024-02-14T09:30');
    expect(timeRange('3mo', end)?.startTime).toBe('2023-12-14T09:30');
    expect(timeRange('180d', end)?.startTime).toBe('2023-09-16T09:30');
  });

  it('rejects unknown ranges', () => {
    expect(timeRange('soon', end)).toBeNull();
  });
});

describe('customRange', () => {
  it('runs from local midnight to 23:59:59 local of the end day', () => {
    const range = customRange('2024-03-01', '2024-03-05')!;

    expect(new Date(range.startTime)).toEqual(new Date(2024, 2, 1));
    expect(new Date(range.endTime)).toEqual(new Date(2024, 2, 5, 23, 59, 59));
    expect(toDateInput(range.startTime)).toBe('2024-03-01');
    expect(toDateInput(range.endTime)).toBe('2024-03-05');
  });

  it('is null when incomplete or reversed', () => {
    expect(customRange('', '2024-03-05')).toBeNull();
    expect(customRange('2024-03-06', '2024-03-05')).toBeNull();
    expect(toDateInput('nope')).toBe('');
  });
});

describe('eventRows', () => {
  const metrics = [metric({ id: 2, status: 'FAILURE' }), metric({ id: 1, sha: 'abc' })];

  it('orders oldest first and converts seconds to minutes', () => {
    const rows = eventRows(metrics);

    expect(rows.map(r => r.id)).toEqual([1, 2]);
    expect(rows[0]).toMatchObject({
      sha: 'abc',
      values: { queuedTime: 1, imagePullTime: 0.5, duration: 2, total: 3.5 }
    });
  });

  it('drops failures when success only', () => {
    expect(eventRows(metrics, true).map(r => r.id)).toEqual([1]);
  });
});

describe('buildBreakdown', () => {
  const names = new Map([
    [7, 'main'],
    [3, 'publish']
  ]);
  const metrics = [
    metric({
      id: 1,
      builds: [
        { id: 11, jobId: 7, duration: 60, status: 'SUCCESS' },
        { id: 12, jobId: 3, duration: 120, status: 'SUCCESS' },
        { id: 13, jobId: 99, duration: 5, status: 'SUCCESS' }
      ]
    }),
    metric({ id: 2, status: 'FAILURE', builds: [{ id: 21, jobId: 7, duration: 30, status: 'FAILURE' }] })
  ];

  it('keys segments by job id, skips unknown jobs, and remembers build ids', () => {
    const { rows, jobs } = buildBreakdown(metrics, names);

    expect(jobs).toEqual([
      { key: '3', jobId: 3, name: 'publish' },
      { key: '7', jobId: 7, name: 'main' }
    ]);
    expect(rows[0]).toMatchObject({ values: { '7': 1, '3': 2 }, buildIds: { '7': 11, '3': 12 } });
    expect(rows[1]!.values).toEqual({ '7': 0.5 });
  });

  it('honours success only', () => {
    expect(buildBreakdown(metrics, names, true).rows).toHaveLength(1);
  });
});

describe('stepBreakdown', () => {
  it('collects step names sorted and minutes per step', () => {
    const { rows, steps } = stepBreakdown([
      { ...metric({ id: 5 }), steps: [{ name: 'test', duration: 90 }, { name: 'install', duration: 30 }, { duration: 1 }] },
      { ...metric({ id: 6, status: 'FAILURE' }), steps: [{ name: 'teardown', duration: null }] }
    ]);

    expect(steps).toEqual(['install', 'teardown', 'test']);
    expect(rows[0]!.values).toEqual({ test: 1.5, install: 0.5 });
    expect(rows[1]!.values).toEqual({ teardown: 0 });
    expect(stepBreakdown([{ ...metric({ id: 6, status: 'FAILURE' }) }], true).rows).toEqual([]);
  });
});

describe('downtimeRows', () => {
  it('counts downtime only for downtime events, and builds per event', () => {
    const rows = downtimeRows([
      { ...metric({ id: 1 }), isDowntimeEvent: true, downtimeDuration: 600, builds: [{ id: 1, jobId: 1, duration: 1, status: 'FAILURE' }] },
      { ...metric({ id: 2 }), isDowntimeEvent: false, downtimeDuration: 600 }
    ]);

    expect(rows.map(r => r.values)).toEqual([
      { downtime: 10, builds: 1 },
      { downtime: 0, builds: 0 }
    ]);
  });
});

describe('summarize', () => {
  const metrics = [
    metric({ id: 1, duration: 100, imagePullTime: 10, queuedTime: 20 }),
    metric({ id: 2, status: 'FAILURE', duration: 300, imagePullTime: 30, queuedTime: 40 })
  ];

  it('counts passed / failed and averages every time, including image pull', () => {
    expect(summarize(metrics)).toEqual({
      total: 2,
      passed: 1,
      failed: 1,
      successRate: 0.5,
      avgDuration: 200,
      avgQueued: 30,
      avgImagePull: 20
    });
  });

  it('keeps totals but averages only successful events when success only', () => {
    expect(summarize(metrics, true)).toMatchObject({ total: 2, failed: 1, avgDuration: 100, avgImagePull: 10 });
    expect(summarize([])).toMatchObject({ total: 0, successRate: 0, avgDuration: 0 });
  });
});

describe('chart helpers', () => {
  it('clamps zoom windows', () => {
    expect(clampZoom(null, 5)).toEqual([0, 4]);
    expect(clampZoom([3, 1], 5)).toEqual([1, 3]);
    expect(clampZoom([2, 10], 5)).toEqual([2, 4]);
    expect(clampZoom([7, 9], 5)).toEqual([0, 4]);
  });

  it('thins tick labels to fit', () => {
    expect(tickIndexes(4, 400, 100)).toEqual([0, 1, 2, 3]);
    expect(tickIndexes(10, 300, 100)).toEqual([0, 4, 8]);
    expect(tickIndexes(0, 300)).toEqual([]);
  });

  it('picks nice y ticks', () => {
    expect(niceTicks(0)).toEqual([0, 1]);
    expect(niceTicks(9)).toEqual([0, 2.5, 5, 7.5, 10]);
    expect(niceTicks(38)).toEqual([0, 10, 20, 30, 40]);
  });

  it('finds the stacked segment under a value', () => {
    const values = { a: 2, b: 0, c: 3 };

    expect(segmentAt(values, ['a', 'b', 'c'], 1)).toBe('a');
    expect(segmentAt(values, ['a', 'b', 'c'], 4)).toBe('c');
    expect(segmentAt(values, ['a', 'b', 'c'], 6)).toBeNull();
  });

  it('assigns categorical colors in fixed order, then gray', () => {
    expect(categoricalColor(0)).toBe('#2a78d6');
    expect(categoricalColor(8)).toBe(OTHER_COLOR);
  });
});
