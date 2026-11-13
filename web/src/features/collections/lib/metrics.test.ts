import { formatDuration, formatMetrics, getGlyph, getTone } from './metrics';

const metric = (over: Record<string, unknown> = {}) => ({
  createTime: '2019-03-12T01:09:55.973Z',
  status: 'SUCCESS',
  duration: 1144,
  sha: '3deb58c4059220c9e5ae92f3ccd1609aa36e47e7',
  commit: { message: 'Fix', url: 'https://github.com/x/y/commit/3deb' },
  ...over
});

describe('formatDuration', () => {
  it('formats seconds as hours, minutes and seconds, dropping leading zero units', () => {
    expect(formatDuration(0)).toBe('0s');
    expect(formatDuration(42)).toBe('42s');
    expect(formatDuration(1144)).toBe('19m 4s');
    expect(formatDuration(3723)).toBe('1h 2m 3s');
  });
});

describe('status mapping', () => {
  it('maps statuses to glyphs and tones', () => {
    expect(getGlyph('queued')).toBe('running');
    expect(getGlyph('warning')).toBe('success');
    expect(getGlyph('nope')).toBe('unknown');
    expect(getTone('aborted')).toBe('failure');
    expect(getTone('blocked')).toBe('running');
  });
});

describe('formatMetrics', () => {
  it('describes a pipeline that never ran', () => {
    const { eventsInfo, lastEventInfo } = formatMetrics([]);

    expect(eventsInfo).toEqual([]);
    expect(lastEventInfo).toMatchObject({ empty: true, status: 'build-empty', durationText: '--', sha: null });
  });

  it('uses the newest event for the summary and every event for the bars', () => {
    const { eventsInfo, lastEventInfo } = formatMetrics([metric(), metric({ status: 'FAILURE', duration: 0 })]);

    expect(eventsInfo).toEqual([
      { duration: 1144, tone: 'success' },
      { duration: 0, tone: 'failure' }
    ]);
    expect(lastEventInfo).toMatchObject({
      status: 'success',
      sha: '3deb58c',
      durationText: '19m 4s',
      commitMessage: 'Fix',
      glyph: 'success'
    });
  });

  it('turns a success with a build warning into a warning', () => {
    const { lastEventInfo } = formatMetrics([metric({ builds: [{ meta: { build: { warning: { message: 'w' } } } }] })]);

    expect(lastEventInfo.tone).toBe('warning');
    expect(lastEventInfo.status).toBe('success');
  });
});
