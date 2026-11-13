import type { Build, SdEvent } from '../types';
import { mockFetch } from '~/test/feature-router';
import {
  EVENT_BUILDS_GC_MS,
  eventsToPrefetch,
  fetchEventBuilds,
  isEventDone,
  prefetchEventBuilds
} from './useEventBuilds';

const event = (createTime: string, message = 'x') =>
  ({ id: 1, type: 'pipeline', createTime, commit: { message } } as Pick<
    SdEvent,
    'id' | 'type' | 'commit' | 'createTime'
  >);
const build = (status: string): Build => ({
  id: 1,
  jobId: 1,
  status,
  createTime: '2020-01-01T00:00:00Z'
});
const old = '2020-01-01T00:00:00Z';

describe('isEventDone', () => {
  it('stops polling finished events', () => {
    expect(isEventDone(event(old), [build('SUCCESS')], new Set())).toBe(true);
  });

  it('keeps polling running events', () => {
    expect(isEventDone(event(old), [build('RUNNING')], new Set())).toBe(false);
  });

  it('stops polling skipped events', () => {
    expect(isEventDone(event(old, 'x [skip ci]'), [], new Set())).toBe(true);
  });

  it('keeps polling brand-new events that have no builds yet', () => {
    expect(isEventDone(event(new Date().toISOString()), [], new Set())).toBe(
      false
    );
  });

  it('gives up on old events that never got builds', () => {
    expect(isEventDone(event(old), [], new Set())).toBe(true);
  });

  it('keeps polling when the first response has only CREATED builds', async () => {
    // fetchEventBuilds keeps the previous response per event in a module-level map: an event id
    // no other test fetches keeps this independent of test order.
    mockFetch([[/\/events\/4242\/builds$/, () => [build('CREATED')]]]);
    const first = await fetchEventBuilds(4242);
    const unique = { ...event(old), id: 4242 };

    // Nothing to compare against yet: a new CREATED build means work is still coming.
    expect(isEventDone(unique, first, new Set())).toBe(false);
    // The same CREATED build on the next poll is one that will not run.
    expect(isEventDone(unique, await fetchEventBuilds(4242), new Set())).toBe(true);
  });

  it('keeps polling a build that just finished until the next job could have been created', async () => {
    const now = new Date().toISOString();
    const a = (status: string) => ({ ...build(status), id: 1, endTime: status === 'RUNNING' ? undefined : now });
    const b = { ...build('RUNNING'), id: 2, jobId: 2, createTime: now };
    const responses = [[a('RUNNING')], [a('SUCCESS')], [a('SUCCESS'), b]];

    mockFetch([[/\/events\/4343\/builds$/, () => responses.shift()]]);
    const unique = { ...event(old), id: 4343 };

    expect(isEventDone(unique, await fetchEventBuilds(4343), new Set())).toBe(false);
    // A has just ended and B is not there yet: one more poll.
    expect(isEventDone(unique, await fetchEventBuilds(4343), new Set())).toBe(false);
    expect(isEventDone(unique, await fetchEventBuilds(4343), new Set())).toBe(false);
  });

  it('is done once a just-finished set comes back unchanged', async () => {
    const done = { ...build('SUCCESS'), endTime: new Date().toISOString() };

    mockFetch([[/\/events\/4444\/builds$/, () => [done]]]);
    const unique = { ...event(old), id: 4444 };

    expect(isEventDone(unique, await fetchEventBuilds(4444), new Set())).toBe(false);
    expect(isEventDone(unique, await fetchEventBuilds(4444), new Set())).toBe(true);
  });
});

describe('eventsToPrefetch', () => {
  const events = Array.from({ length: 40 }, (_, i) => i);

  it('takes one batch below and one above the range, nearest first, never the range', () => {
    expect(eventsToPrefetch(events, 15, 20, 3)).toEqual([
      21, 22, 23, 14, 13, 12
    ]);
  });

  it('clamps at both ends of the list', () => {
    expect(eventsToPrefetch(events, 1, 38, 5)).toEqual([39, 0]);
    expect(eventsToPrefetch([], 0, 0, 5)).toEqual([]);
  });
});

describe('prefetchEventBuilds', () => {
  it('is a one-off fetch (no polling) that is kept in the cache for a while', () => {
    const prefetchQuery = vi.fn().mockResolvedValue(undefined);

    prefetchEventBuilds({ prefetchQuery } as never, 7);
    const options = prefetchQuery.mock.calls[0]![0];

    expect(options.queryKey).toEqual(['eventBuilds', 7]);
    expect(options.refetchInterval).toBeUndefined();
    expect(options.gcTime).toBe(EVENT_BUILDS_GC_MS);
  });
});
