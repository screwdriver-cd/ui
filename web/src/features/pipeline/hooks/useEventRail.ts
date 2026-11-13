import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
  type InfiniteData
} from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '~/api/client';
import { config } from '~/config/config';
import { fetchJobs } from '../api/queries';
import type { SdEvent } from '../types';
import { getPrNumbers } from '../utils/pr';

export const EVENT_BATCH_SIZE = 10;
/**
 * Pages kept in memory. Fetching one more drops the page at the opposite end,
 * so a long scroll holds about this many batches (the anchor page is 2x) instead
 * of the whole history. Dropped events are fetched again if the user scrolls back.
 */
export const RAIL_MAX_PAGES = 8;
const MAX_CATCH_UP_BATCHES = 20;

export type RailMode = 'pipeline' | 'pr';

/** Which request produced a page. The anchor page is the selected event plus its neighbours. */
export type PageParam =
  | { kind: 'anchor'; event: SdEvent }
  | { kind: 'older'; event: SdEvent }
  | { kind: 'newer'; event: SdEvent }
  | { kind: 'merged' };

/** Events are always newest first. `olderEnd`/`newerEnd` mean nothing lies beyond this page. */
export interface RailPage {
  events: SdEvent[];
  olderEnd?: boolean;
  newerEnd?: boolean;
}

export interface RailScope {
  pipelineId: number;
  mode: RailMode;
  filterScheduler: boolean;
}

type Direction = 'gt' | 'lt';

interface Batch {
  events: SdEvent[];
  exhausted: boolean;
}

export const railKey = (scope: RailScope, anchorId: number) =>
  [
    'eventRail',
    scope.pipelineId,
    scope.mode,
    scope.filterScheduler,
    anchorId
  ] as const;

async function currentPrNums(
  scope: RailScope,
  prNums?: () => number[] | undefined
): Promise<number[]> {
  return prNums?.() ?? getPrNumbers(await fetchJobs(scope.pipelineId, 'pr'));
}

/**
 * One batch beyond `event` in `direction`, newest first.
 * Pipeline mode is one cursor request. PR mode has no cursor on the API, so it
 * walks the open PR numbers and fetches one event per PR number.
 */
export async function fetchBatch(
  scope: RailScope,
  event: SdEvent,
  direction: Direction,
  prNums?: () => number[] | undefined
): Promise<Batch> {
  if (scope.mode === 'pr') {
    const open = await currentPrNums(scope, prNums);
    const eventPr = Number(event.prNum);
    const ordered = direction === 'gt' ? open : [...open].reverse();
    let index = ordered.indexOf(eventPr);

    if (index === -1) {
      index =
        direction === 'gt'
          ? ordered.filter(n => n < eventPr).length - 1
          : ordered.filter(n => n > eventPr).length - 1;
    }

    const slice = ordered.slice(index + 1, index + 1 + EVENT_BATCH_SIZE);
    const events = await Promise.all(
      slice.map(async prNum => {
        const found = await api.get<SdEvent[]>(
          `/pipelines/${scope.pipelineId}/events`,
          {
            query: { type: 'pr', prNum }
          }
        );

        return found[0];
      })
    );
    const present = events.filter((e): e is SdEvent => Boolean(e));

    // `slice.length` (not `present.length`) decides whether the walk is over.
    return {
      events: direction === 'gt' ? present.reverse() : present,
      exhausted: slice.length < EVENT_BATCH_SIZE
    };
  }

  const list = await api.get<SdEvent[]>(
    `/pipelines/${scope.pipelineId}/events`,
    {
      query: {
        count: EVENT_BATCH_SIZE,
        type: 'pipeline',
        id: `${direction}:${event.id}`,
        sort: direction === 'gt' ? 'ascending' : 'descending',
        creator: scope.filterScheduler ? 'ne:sd:scheduler' : undefined
      }
    }
  );

  return {
    events: direction === 'gt' ? [...list].reverse() : list,
    // A short page means nothing lies beyond it.
    exhausted: list.length < EVENT_BATCH_SIZE
  };
}

/** The latest event of each PR number (PR mode), skipping PRs without one. */
export async function fetchLatestPrEvents(
  pipelineId: number,
  prNums: number[]
): Promise<SdEvent[]> {
  const events = await Promise.all(
    prNums.map(
      async prNum =>
        (
          await api.get<SdEvent[]>(`/pipelines/${pipelineId}/events`, {
            query: { type: 'pr', prNum }
          })
        )[0]
    )
  );

  return events.filter((e): e is SdEvent => Boolean(e));
}

/**
 * The newest events, used to notice events that appeared after the rail loaded. PR mode only
 * looks at open PRs above `newestPr` (the newest loaded): listed PRs are refreshed where they are
 * shown (see `useEventRail`'s visible PRs), so this is just the new PRs, usually none.
 */
async function fetchHead(
  scope: RailScope,
  prNums?: () => number[] | undefined,
  newestPr?: number
): Promise<SdEvent[]> {
  if (scope.mode === 'pr') {
    const open = (await currentPrNums(scope, prNums))
      .filter(n => newestPr === undefined || n > newestPr)
      .slice(-EVENT_BATCH_SIZE)
      .reverse();

    return fetchLatestPrEvents(scope.pipelineId, open);
  }

  return api.get<SdEvent[]>(`/pipelines/${scope.pipelineId}/events`, {
    query: {
      count: EVENT_BATCH_SIZE,
      type: 'pipeline',
      sort: 'descending',
      creator: scope.filterScheduler ? 'ne:sd:scheduler' : undefined
    }
  });
}

/** Flattens pages into one gap-free, duplicate-free list and counts the events above the anchor page. */
export function flattenPages(
  data: InfiniteData<RailPage, PageParam> | undefined
) {
  const events: SdEvent[] = [];
  const seen = new Set<number>();
  let aboveAnchor = 0;
  let reachedAnchor = false;

  data?.pages.forEach((page, i) => {
    const param = data.pageParams[i];

    page.events.forEach(event => {
      if (param?.kind === 'anchor' && event.id === param.event.id) {
        reachedAnchor = true;
      }
      if (!seen.has(event.id)) {
        seen.add(event.id);
        events.push(event);
        if (!reachedAnchor) {
          aboveAnchor += 1;
        }
      }
    });
  });

  return { events, aboveAnchor };
}

/**
 * Puts newly collected events on top as their own page, then trims the oldest
 * pages (and their params) so the window never exceeds maxPages, as the
 * query's own previous-page fetches do.
 */
export function prependMergedPage(
  data: InfiniteData<RailPage, PageParam>,
  events: SdEvent[],
  maxPages: number
): InfiniteData<RailPage, PageParam> {
  const limit = Math.max(1, maxPages);

  return {
    pages: [{ events, newerEnd: true } as RailPage, ...data.pages].slice(0, limit),
    pageParams: [{ kind: 'merged' } as PageParam, ...data.pageParams].slice(0, limit)
  };
}

/**
 * PR mode lists one event per PR number, so a new commit on an already listed PR
 * is a new event with the same prNum. Swaps such events in place; returns the
 * pages unchanged (same reference) when nothing matched.
 */
export function replacePrEvents(
  data: InfiniteData<RailPage, PageParam>,
  fresh: SdEvent[]
): InfiniteData<RailPage, PageParam> {
  const byPr = new Map(fresh.map(e => [String(e.prNum), e]));
  let changed = false;
  const pages = data.pages.map(page => {
    let pageChanged = false;
    const events = page.events.map(e => {
      const next = byPr.get(String(e.prNum));

      if (next && next.id > e.id) {
        pageChanged = true;

        return next;
      }

      return e;
    });

    if (!pageChanged) {
      return page;
    }
    changed = true;

    return { ...page, events };
  });

  return changed ? { ...data, pages } : data;
}

interface Options {
  scope: RailScope;
  /** The event the rail is anchored on (deep link target). */
  anchor: SdEvent;
  /** Latest open PR numbers (PR mode). */
  prNums?: number[];
  /** True while the user is looking at the top of the list. */
  atTop: boolean;
  /** Page window; defaults to RAIL_MAX_PAGES. */
  maxPages?: number;
}

/**
 * The absolute index of the first rendered event (react-virtuoso's
 * `firstItemIndex`) after the list changed from `prevIds` to `nextIds`.
 * Events prepended at the top lower it, events trimmed off the top raise it,
 * so every remaining event keeps its index and Virtuoso keeps the scroll
 * position anchored to what is on screen.
 */
export function nextFirstItemIndex(
  prevIds: readonly number[],
  nextIds: readonly number[],
  prevFirst: number
): number {
  const prevHead = prevIds[0];
  const nextHead = nextIds[0];

  if (
    prevHead === undefined ||
    nextHead === undefined ||
    prevHead === nextHead
  ) {
    return prevFirst;
  }

  const trimmed = prevIds.indexOf(nextHead);

  if (trimmed > 0) {
    return prevFirst + trimmed;
  }

  const prepended = nextIds.indexOf(prevHead);

  return prepended > 0 ? prevFirst - prepended : prevFirst;
}

export function useEventRail({
  scope,
  anchor,
  prNums,
  atTop,
  maxPages = RAIL_MAX_PAGES
}: Options) {
  const queryClient = useQueryClient();
  const key = railKey(scope, anchor.id);
  const prRef = useRef(prNums);

  prRef.current = prNums;

  const getPrNums = useCallback(() => prRef.current, []);

  const query = useInfiniteQuery<
    RailPage,
    Error,
    InfiniteData<RailPage, PageParam>,
    readonly unknown[],
    PageParam
  >({
    queryKey: key,
    initialPageParam: { kind: 'anchor', event: anchor },
    queryFn: async ({ pageParam }): Promise<RailPage> => {
      if (pageParam.kind === 'anchor') {
        const [newer, older] = await Promise.all([
          fetchBatch(scope, pageParam.event, 'gt', getPrNums),
          fetchBatch(scope, pageParam.event, 'lt', getPrNums)
        ]);

        return {
          events: [...newer.events, pageParam.event, ...older.events],
          newerEnd: newer.exhausted,
          olderEnd: older.exhausted
        };
      }
      if (pageParam.kind === 'older') {
        const older = await fetchBatch(scope, pageParam.event, 'lt', getPrNums);

        return { events: older.events, olderEnd: older.exhausted };
      }
      if (pageParam.kind === 'newer') {
        const newer = await fetchBatch(scope, pageParam.event, 'gt', getPrNums);

        return { events: newer.events, newerEnd: newer.exhausted };
      }

      return { events: [] };
    },
    getNextPageParam: lastPage => {
      const oldest = lastPage.events[lastPage.events.length - 1];

      return lastPage.olderEnd || !oldest
        ? undefined
        : { kind: 'older', event: oldest };
    },
    getPreviousPageParam: firstPage => {
      const newest = firstPage.events[0];

      return firstPage.newerEnd || !newest
        ? undefined
        : { kind: 'newer', event: newest };
    },
    maxPages,
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false
  });

  const { events, aboveAnchor } = useMemo(
    () => flattenPages(query.data),
    [query.data]
  );
  const loadedIds = useMemo(() => new Set(events.map(e => e.id)), [events]);
  const newestLoaded = events[0];
  const newestPrRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    newestPrRef.current =
      scope.mode === 'pr' && newestLoaded?.prNum !== undefined
        ? Number(newestLoaded.prNum)
        : undefined;
  }, [scope.mode, newestLoaded?.prNum]);

  // Events that appeared after the rail first loaded. The head query is the
  // "first page" refresh: it runs on EVENT_RELOAD_TIMER wherever the user is
  // scrolled, so a deep-linked old event still learns about new events.
  const head = useQuery({
    queryKey: [
      'eventRailHead',
      scope.pipelineId,
      scope.mode,
      scope.filterScheduler,
      anchor.id
    ],
    queryFn: () => fetchHead(scope, getPrNums, newestPrRef.current),
    refetchInterval: config.eventReloadTimer,
    staleTime: 0,
    gcTime: 0
  });
  // What counts as new: a higher event id, or in PR mode a higher PR number. A new commit on a
  // listed PR is a newer event too, but it is not a new PR, so it must not move the PR baseline.
  const order = useCallback(
    (e: SdEvent) => (scope.mode === 'pr' ? Number(e.prNum) || 0 : e.id),
    [scope.mode]
  );
  const [baseline, setBaseline] = useState<number | null>(null);

  useEffect(() => {
    if (baseline === null && head.data) {
      setBaseline(Math.max(order(anchor), ...head.data.map(order)));
    }
  }, [baseline, head.data, anchor, order]);

  const pendingEvents = useMemo(
    () =>
      baseline === null
        ? []
        : (head.data ?? []).filter(
            e => order(e) > baseline && !loadedIds.has(e.id)
          ),
    [baseline, head.data, loadedIds, order]
  );

  /** Loads everything newer than the newest loaded event and prepends it. */
  const catchUp = useCallback(async () => {
    const data =
      queryClient.getQueryData<InfiniteData<RailPage, PageParam>>(key);
    let cursor = flattenPages(data).events[0];
    const collected: SdEvent[] = [];

    for (let i = 0; cursor && i < MAX_CATCH_UP_BATCHES; i += 1) {
      const batch = await fetchBatch(scope, cursor, 'gt', getPrNums);

      if (batch.events.length === 0) {
        break;
      }
      collected.unshift(...batch.events);
      cursor = batch.events[0] as SdEvent;
      if (batch.exhausted) {
        break;
      }
    }

    // PR mode only walks higher PR numbers here; new commits on listed PRs are swapped in place
    // by the visible-PR refresh below.
    if (collected.length === 0) {
      return false;
    }

    // The head query keeps reporting these as new once their page is trimmed off the window.
    setBaseline(b => Math.max(b ?? 0, ...collected.map(order)));
    queryClient.setQueryData<InfiniteData<RailPage, PageParam>>(key, old =>
      old ? prependMergedPage(old, collected, maxPages) : old
    );

    return true;
  }, [getPrNums, key, maxPages, order, queryClient, scope]);

  // PR mode: a new commit on a listed PR is a new event with the same prNum. Only the PRs on
  // screen (plus a buffer either side, see `setVisiblePrs`) are polled; a card scrolling back
  // into that window is refreshed straight away when its last check is older than a poll.
  const visiblePrs = useRef<number[]>([]);
  const checkedAt = useRef(new Map<number, number>());
  const { pipelineId, mode, filterScheduler } = scope;
  const anchorId = anchor.id;
  const refreshPrs = useCallback(
    async (nums: number[]) => {
      if (mode !== 'pr' || nums.length === 0) {
        return;
      }
      const now = Date.now();

      nums.forEach(n => checkedAt.current.set(n, now));
      const fresh = await fetchLatestPrEvents(pipelineId, nums);

      if (fresh.length === 0) {
        return;
      }
      queryClient.setQueryData<InfiniteData<RailPage, PageParam>>(
        railKey({ pipelineId, mode, filterScheduler }, anchorId),
        old => (old ? replacePrEvents(old, fresh) : old)
      );
    },
    // Primitives only: this must stay stable across renders, or the poll below restarts on each one.
    [queryClient, pipelineId, mode, filterScheduler, anchorId]
  );
  const setVisiblePrs = useCallback(
    (nums: number[]) => {
      visiblePrs.current = nums;
      const stale = Date.now() - config.eventReloadTimer;

      void refreshPrs(nums.filter(n => (checkedAt.current.get(n) ?? 0) <= stale));
    },
    [refreshPrs]
  );

  useEffect(() => {
    if (mode !== 'pr') {
      return undefined;
    }
    const id = setInterval(
      () => void refreshPrs(visiblePrs.current),
      config.eventReloadTimer
    );

    return () => clearInterval(id);
  }, [refreshPrs, mode]);

  const [merged, setMerged] = useState(0);
  const merging = useRef(false);
  const reachesHead = !query.hasPreviousPage;

  // On the newest event: new events slot in at the top. Anywhere else the
  // list must not move, so they are only counted (the "N new events" pill).
  useEffect(() => {
    if (
      pendingEvents.length > 0 &&
      atTop &&
      reachesHead &&
      !merging.current &&
      query.data
    ) {
      merging.current = true;
      catchUp()
        .then(changed => changed && setMerged(n => n + 1))
        .finally(() => {
          merging.current = false;
        });
    }
  }, [pendingEvents.length, atTop, reachesHead, catchUp, query.data]);

  const showPending = useCallback(async () => {
    const changed = await catchUp();

    if (changed) {
      setMerged(n => n + 1);
    }
  }, [catchUp]);

  return {
    events,
    aboveAnchor,
    anchorIndex: aboveAnchor,
    newestLoaded,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    hasNextPage: query.hasNextPage,
    hasPreviousPage: query.hasPreviousPage,
    isFetchingNextPage: query.isFetchingNextPage,
    isFetchingPreviousPage: query.isFetchingPreviousPage,
    fetchNextPage: query.fetchNextPage,
    fetchPreviousPage: query.fetchPreviousPage,
    pendingCount: pendingEvents.length,
    showPending,
    /** Bumps whenever new events were prepended, so the list can scroll back to the top. */
    mergedVersion: merged,
    /** PR mode: the PR numbers on (and near) screen, which are kept up to date. */
    setVisiblePrs
  };
}
