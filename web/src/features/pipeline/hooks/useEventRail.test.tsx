import { QueryClient, QueryClientProvider, type InfiniteData } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { api } from '~/api/client';
import { config } from '~/config/config';
import type { SdEvent } from '../types';
import {
  EVENT_BATCH_SIZE,
  fetchBatch,
  flattenPages,
  nextFirstItemIndex,
  prependMergedPage,
  replacePrEvents,
  type PageParam,
  type RailPage,
  type RailScope,
  useEventRail
} from './useEventRail';

vi.mock('~/api/client', () => ({ api: { get: vi.fn() } }));

const ev = (id: number, extra: Partial<SdEvent> = {}) =>
  ({ id, pipelineId: 1, type: 'pipeline', ...extra } as SdEvent);
const range = (from: number, to: number) => {
  const out: SdEvent[] = [];

  for (let i = from; i >= to; i -= 1) {
    out.push(ev(i));
  }

  return out;
};
const scope: RailScope = {
  pipelineId: 1,
  mode: 'pipeline',
  filterScheduler: false
};

describe('flattenPages', () => {
  it('counts the events above the anchor, including those in the anchor page', () => {
    const data: InfiniteData<RailPage, PageParam> = {
      pages: [{ events: [...range(40, 31), ev(30), ...range(29, 20)] }],
      pageParams: [{ kind: 'anchor', event: ev(30) }]
    };
    const { events, aboveAnchor } = flattenPages(data);

    expect(events).toHaveLength(21);
    expect(aboveAnchor).toBe(10);
  });

  it('counts prepended pages and drops duplicates', () => {
    const data: InfiniteData<RailPage, PageParam> = {
      pages: [
        { events: range(50, 41) },
        { events: [...range(40, 31), ev(30), ...range(29, 20)] },
        { events: range(20, 11) }
      ],
      pageParams: [
        { kind: 'newer', event: ev(40) },
        { kind: 'anchor', event: ev(30) },
        { kind: 'older', event: ev(20) }
      ]
    };
    const { events, aboveAnchor } = flattenPages(data);

    expect(aboveAnchor).toBe(20);
    expect(events.map(e => e.id)).toEqual([...range(50, 11).map(e => e.id)]);
  });

  it('handles no data', () => {
    expect(flattenPages(undefined)).toEqual({ events: [], aboveAnchor: 0 });
  });
});

describe('fetchBatch (pipeline mode)', () => {
  beforeEach(() => vi.mocked(api.get).mockReset());

  it('asks for older events with a descending lt cursor', async () => {
    vi.mocked(api.get).mockResolvedValue(range(29, 20));
    const batch = await fetchBatch(scope, ev(30), 'lt');

    expect(api.get).toHaveBeenCalledWith('/pipelines/1/events', {
      query: {
        count: EVENT_BATCH_SIZE,
        type: 'pipeline',
        id: 'lt:30',
        sort: 'descending',
        creator: undefined
      }
    });
    expect(batch.exhausted).toBe(false);
    expect(batch.events[0]?.id).toBe(29);
  });

  it('asks for newer events ascending and returns them newest first', async () => {
    vi.mocked(api.get).mockResolvedValue([ev(31), ev(32), ev(33)]);
    const batch = await fetchBatch(scope, ev(30), 'gt');

    expect(vi.mocked(api.get).mock.calls[0]?.[1]).toMatchObject({
      query: { id: 'gt:30', sort: 'ascending' }
    });
    expect(batch.events.map(e => e.id)).toEqual([33, 32, 31]);
    expect(batch.exhausted).toBe(true);
  });

  it('adds the scheduler filter when the pipeline setting is on', async () => {
    vi.mocked(api.get).mockResolvedValue([]);
    await fetchBatch({ ...scope, filterScheduler: true }, ev(5), 'lt');

    expect(vi.mocked(api.get).mock.calls[0]?.[1]).toMatchObject({
      query: { creator: 'ne:sd:scheduler' }
    });
  });
});

describe('fetchBatch (PR mode)', () => {
  beforeEach(() => vi.mocked(api.get).mockReset());

  it('walks the open PR numbers instead of using a cursor', async () => {
    vi.mocked(api.get).mockImplementation(async (_path, options) => [
      ev(Number(options?.query?.prNum) * 10, {
        type: 'pr',
        prNum: Number(options?.query?.prNum)
      })
    ]);
    const batch = await fetchBatch(
      { ...scope, mode: 'pr' },
      ev(30, { type: 'pr', prNum: 3 }),
      'lt',
      () => [1, 2, 3, 4]
    );

    expect(batch.events.map(e => e.prNum)).toEqual([2, 1]);
    expect(batch.exhausted).toBe(true);
  });
});

describe('nextFirstItemIndex', () => {
  const ids = (from: number, to: number) => range(from, to).map(e => e.id);

  it('keeps the index when the head is unchanged or the list was empty', () => {
    expect(nextFirstItemIndex(ids(30, 21), ids(30, 11), 1000)).toBe(1000);
    expect(nextFirstItemIndex([], ids(30, 21), 1000)).toBe(1000);
  });

  it('lowers it by the number of events prepended', () => {
    expect(nextFirstItemIndex(ids(30, 21), ids(40, 21), 1000)).toBe(990);
  });

  it('raises it by the number of events trimmed off the top, so remaining events keep their index', () => {
    const before = ids(50, 11);
    const after = ids(30, 1);
    // event 30 sat at index 1000 + 20 and must still be there.
    const first = nextFirstItemIndex(before, after, 1000);

    expect(first).toBe(1020);
    expect(first + after.indexOf(30)).toBe(1000 + before.indexOf(30));
  });

  it('keeps the index when the old and new lists do not overlap (the rail re-anchors)', () => {
    expect(nextFirstItemIndex(ids(40, 31), ids(30, 21), 500)).toBe(500);
  });
});

describe('replacePrEvents', () => {
  const pr = (id: number, prNum: number) =>
    ev(id, { type: 'pr', prNum } as Partial<SdEvent>);
  const data = (events: SdEvent[]): InfiniteData<RailPage, PageParam> => ({
    pages: [{ events }],
    pageParams: [{ kind: 'merged' }]
  });

  it('swaps a PR event for the newer event of the same PR', () => {
    const out = replacePrEvents(data([pr(10, 5), pr(8, 4)]), [pr(12, 5)]);

    expect(out.pages[0]?.events.map(e => e.id)).toEqual([12, 8]);
  });

  it('returns the same data when nothing is newer', () => {
    const input = data([pr(10, 5)]);

    expect(replacePrEvents(input, [pr(10, 5), pr(3, 9)])).toBe(input);
  });
});

describe('prependMergedPage', () => {
  it('trims the oldest pages and params to maxPages', () => {
    const data: InfiniteData<RailPage, PageParam> = {
      pages: [{ events: [ev(5)] }, { events: [ev(3)] }],
      pageParams: [{ kind: 'merged' }, { kind: 'older' } as unknown as PageParam]
    };
    const out = prependMergedPage(data, [ev(9)], 2);

    expect(out.pages.map(p => p.events[0]?.id)).toEqual([9, 5]);
    expect(out.pageParams).toHaveLength(2);
    expect(out.pageParams[1]).toEqual({ kind: 'merged' });
  });

  it('keeps everything while under the window', () => {
    const out = prependMergedPage({ pages: [{ events: [ev(5)] }], pageParams: [{ kind: 'merged' }] }, [ev(9)], 8);

    expect(out.pages).toHaveLength(2);
    expect(out.pageParams).toHaveLength(2);
  });
});

describe('useEventRail PR refresh', () => {
  const prScope: RailScope = { pipelineId: 1, mode: 'pr', filterScheduler: false };
  const open = Array.from({ length: 30 }, (_, i) => i + 1);
  let latest: Map<number, number>;
  const prCalls = () =>
    vi
      .mocked(api.get)
      .mock.calls.map(([, opts]) => (opts as { query?: { prNum?: number } })?.query?.prNum)
      .filter((n): n is number => n !== undefined);

  beforeEach(() => {
    latest = new Map(open.map(n => [n, n * 10]));
    vi.mocked(api.get).mockReset();
    vi.mocked(api.get).mockImplementation(async (_path, opts) => {
      const prNum = (opts as { query: { prNum: number } }).query.prNum;

      return [ev(latest.get(prNum) as number, { type: 'pr', prNum })] as never;
    });
  });

  function renderRail() {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    return renderHook(
      () =>
        useEventRail({
          scope: prScope,
          anchor: ev(300, { type: 'pr', prNum: 30 }),
          prNums: open,
          atTop: true
        }),
      {
        wrapper: ({ children }) => (
          <QueryClientProvider client={client}>{children}</QueryClientProvider>
        )
      }
    );
  }

  it('refreshes the PRs on screen in place and skips ones checked within a poll', async () => {
    const { result, rerender } = renderRail();

    await waitFor(() => expect(result.current.events).toHaveLength(EVENT_BATCH_SIZE + 1));
    // Stable across renders, so the poll is not restarted by every render.
    const setVisible = result.current.setVisiblePrs;

    rerender();
    expect(result.current.setVisiblePrs).toBe(setVisible);
    // Loaded: PRs 30..20. Nothing is fetched for PRs that are neither loaded nor new.
    expect(prCalls().some(n => n < 20)).toBe(false);

    latest.set(25, 999);
    vi.mocked(api.get).mockClear();
    act(() => result.current.setVisiblePrs([24, 25, 26]));
    await waitFor(() => expect(result.current.events.map(e => e.id)).toContain(999));
    expect(prCalls().sort()).toEqual([24, 25, 26]);
    // Swapped in place: same position, not counted as a new event.
    expect(result.current.events[5]).toMatchObject({ id: 999, prNum: 25 });
    expect(result.current.pendingCount).toBe(0);

    // Scrolling back to cards that were just checked does not ask again; a new card does.
    vi.mocked(api.get).mockClear();
    act(() => result.current.setVisiblePrs([25, 26, 27]));
    await waitFor(() => expect(prCalls()).toEqual([27]));
  });

  it('still counts a newly opened PR after a listed PR got a newer event', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result, rerender } = renderHook(
      ({ prNums }: { prNums: number[] }) =>
        useEventRail({
          scope: prScope,
          anchor: ev(300, { type: 'pr', prNum: 30 }),
          prNums,
          atTop: false
        }),
      {
        initialProps: { prNums: open },
        wrapper: ({ children }) => (
          <QueryClientProvider client={client}>{children}</QueryClientProvider>
        )
      }
    );

    await waitFor(() => expect(result.current.events).toHaveLength(EVENT_BATCH_SIZE + 1));
    // PR 31 opens (event 305), then listed PR 25 gets a newer commit (event 999).
    latest.set(31, 305);
    rerender({ prNums: [...open, 31] });
    latest.set(25, 999);
    act(() => result.current.setVisiblePrs([25]));
    await waitFor(() => expect(result.current.events.map(e => e.id)).toContain(999));

    await act(() => client.refetchQueries({ queryKey: ['eventRailHead'] }));
    await waitFor(() => expect(result.current.pendingCount).toBe(1));
  });

  it('checks a card again once its last check is older than a poll', async () => {
    const { result } = renderRail();

    await waitFor(() => expect(result.current.events).toHaveLength(EVENT_BATCH_SIZE + 1));
    act(() => result.current.setVisiblePrs([22]));
    await waitFor(() => expect(prCalls()).toContain(22));

    vi.mocked(api.get).mockClear();
    const now = Date.now();

    vi.spyOn(Date, 'now').mockReturnValue(now + config.eventReloadTimer + 1);
    latest.set(22, 777);
    act(() => result.current.setVisiblePrs([22]));
    await waitFor(() => expect(result.current.events.map(e => e.id)).toContain(777));
  });
});
