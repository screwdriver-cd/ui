import type { Build, SdEvent } from '../types';
import {
  formatShortDuration,
  getStatus,
  getSuccessCount,
  getFailureCount,
  isComplete,
  isSkipped,
  withWarningStatus
} from './event';

const build = (
  id: number,
  status: string,
  extra: Partial<Build> = {}
): Build => ({
  id,
  jobId: id,
  status,
  createTime: '2020-01-01T00:00:00Z',
  ...extra
});
const event = (message: string, type: SdEvent['type'] = 'pipeline') =>
  ({ type, commit: { message } } as Pick<SdEvent, 'type' | 'commit'>);

describe('isSkipped', () => {
  it('is true for [skip ci] commits with no builds', () => {
    expect(isSkipped(event('fix [skip ci]'), [])).toBe(true);
    expect(isSkipped(event('fix [ci skip]'), undefined)).toBe(true);
  });

  it('is false once builds exist, for PRs, and for normal commits', () => {
    expect(isSkipped(event('fix [skip ci]'), [build(1, 'SUCCESS')])).toBe(
      false
    );
    expect(isSkipped(event('fix [skip ci]', 'pr'), [])).toBe(false);
    expect(isSkipped(event('fix'), [])).toBe(false);
  });
});

describe('isComplete', () => {
  it('needs builds', () => {
    expect(isComplete([])).toBe(false);
    expect(isComplete(undefined)).toBe(false);
  });

  it('is false while any build is unfinished', () => {
    expect(isComplete([build(1, 'SUCCESS'), build(2, 'RUNNING')])).toBe(false);
  });

  it('is true when everything finished', () => {
    expect(isComplete([build(1, 'SUCCESS'), build(2, 'FAILURE')])).toBe(true);
  });

  it('is false when a new CREATED build appeared since the last snapshot', () => {
    const before = [build(1, 'SUCCESS')];
    const now = [build(1, 'SUCCESS'), build(2, 'CREATED')];

    expect(isComplete(now, before)).toBe(false);
    expect(isComplete(now, now)).toBe(true);
  });

  it('ignores CREATED builds of virtual jobs', () => {
    expect(
      isComplete(
        [build(1, 'SUCCESS'), build(2, 'CREATED')],
        [build(1, 'SUCCESS')],
        new Set([2])
      )
    ).toBe(true);
  });

  it('treats UNSTABLE as finished only with an end time', () => {
    expect(isComplete([build(1, 'UNSTABLE')])).toBe(false);
    expect(
      isComplete([build(1, 'UNSTABLE', { endTime: '2020-01-01T00:01:00Z' })])
    ).toBe(true);
  });
});

describe('getStatus', () => {
  it('maps skipped, unknown, running and finished events', () => {
    expect(getStatus([], true, false)).toBe('SKIPPED');
    expect(getStatus([], false, false)).toBe('UNKNOWN');
    expect(getStatus([build(1, 'RUNNING')], false, false)).toBe('RUNNING');
    expect(getStatus([build(1, 'FROZEN')], false, false)).toBe('FROZEN');
    expect(getStatus([build(1, 'FAILURE')], false, true)).toBe('FAILURE');
    expect(
      getStatus([build(1, 'SUCCESS'), build(2, 'WARNING')], false, true)
    ).toBe('WARNING');
  });
});

describe('counts and formatting', () => {
  it('counts failures (aborted included) and successes', () => {
    const builds = [
      build(1, 'SUCCESS'),
      build(2, 'FAILURE'),
      build(3, 'ABORTED')
    ];

    expect(getSuccessCount(builds)).toBe(1);
    expect(getFailureCount(builds)).toBe(2);
  });

  it('marks successful builds with warnings', () => {
    expect(
      withWarningStatus(
        build(1, 'SUCCESS', { meta: { build: { warning: { message: 'x' } } } })
      ).status
    ).toBe('WARNING');
    expect(withWarningStatus(build(1, 'SUCCESS')).status).toBe('SUCCESS');
  });

  it('formats durations compactly', () => {
    expect(formatShortDuration(0)).toBe('0s');
    expect(formatShortDuration(347_000)).toBe('5m 47s');
    expect(formatShortDuration(3_665_000)).toBe('1h 1m 5s');
  });
});
