import { useQuery, type QueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { api } from '~/api/client';
import { config } from '~/config/config';
import { keys, useJobs } from '../api/queries';
import type { Build, Job, SdEvent } from '../types';
import { isComplete, isSkipped, withWarningStatus } from '../utils/event';
import { isVirtualJob } from '../utils/job';

/**
 * The previous and current snapshot of an event's builds. `isComplete` needs
 * both (a newly CREATED build means a downstream job is still pending), but
 * the query cache stays a plain Build[] so the graph can share it.
 */
const snapshots = new Map<number, { previous: Build[]; current: Build[] }>();

/** Bounds the module-level snapshots; the least recently fetched events are dropped first. */
const MAX_SNAPSHOTS = 200;

export async function fetchEventBuilds(eventId: number): Promise<Build[]> {
  const raw = await api.get<Build[]>(`/events/${eventId}/builds`, {
    query: { fetchSteps: false }
  });
  const builds = raw.map(withWarningStatus);
  const before = snapshots.get(eventId);

  snapshots.delete(eventId);
  // The first response has nothing before it: comparing it with itself would call an event of
  // only CREATED builds complete and stop polling it for good.
  snapshots.set(eventId, {
    previous: before ? before.current : [],
    current: builds
  });
  while (snapshots.size > MAX_SNAPSHOTS) {
    snapshots.delete(snapshots.keys().next().value as number);
  }

  return builds;
}

export const virtualJobIdsOf = (jobs: Job[] | undefined) =>
  new Set((jobs ?? []).filter(isVirtualJob).map(j => j.id));

/**
 * How long the builds of an event stay cached once no card shows them. Cards unmount constantly
 * (virtual list), and a card that scrolls back in should paint from cache, but the rail trims
 * old pages so the entries must not pile up for long.
 */
export const EVENT_BUILDS_GC_MS = 10 * 60 * 1000;

const NEW_EVENT_GRACE_MS = 2 * 60 * 1000;

export function isEventDone(
  event: Pick<SdEvent, 'id' | 'type' | 'commit' | 'createTime'>,
  builds: Build[] | undefined,
  virtual: Set<number>
) {
  const snapshot = snapshots.get(event.id);

  if (isSkipped(event, builds)) {
    return true;
  }
  if (!builds?.length) {
    // No builds: finished (nothing will ever appear) unless the event is brand new.
    return (
      Date.now() - new Date(event.createTime).getTime() > NEW_EVENT_GRACE_MS
    );
  }

  const previous = snapshot?.previous ?? builds;

  if (!isComplete(builds, previous, virtual)) {
    return false;
  }

  // The API saves a build's end before it creates the next job's build, so a poll in between sees
  // a finished event. Shortly after the last build ended, only the same finished set seen twice
  // counts as done.
  const lastEnd = Math.max(
    ...builds.map(b => new Date(b.endTime ?? b.createTime).getTime())
  );

  return (
    Date.now() - lastEnd > NEW_EVENT_GRACE_MS || sameBuilds(previous, builds)
  );
}

const sameBuilds = (a: Build[], b: Build[]) =>
  a.length === b.length &&
  b.every(x => a.some(y => y.id === x.id && y.status === x.status));

/**
 * Builds of one event. `delayMs` holds the first request back until the caller
 * has stayed mounted that long. Polls on BUILD_RELOAD_TIMER only while the event is
 * running AND the caller is mounted (a card that scrolled out of the virtual
 * list unmounts, which stops its polling). Finished events never refetch.
 */
export function useEventBuilds(
  event: SdEvent,
  { poll = true, delayMs = 0 }: { poll?: boolean; delayMs?: number } = {}
) {
  const jobs = useJobs(event.pipelineId, 'pipeline');
  // Cards that exist for a moment (the virtual list's size probe, a fling past the list) never ask.
  const [ready, setReady] = useState(delayMs <= 0);

  useEffect(() => {
    if (ready) {
      return undefined;
    }

    const id = setTimeout(() => setReady(true), delayMs);

    return () => clearTimeout(id);
  }, [ready, delayMs]);
  const virtual = virtualJobIdsOf(jobs.data);
  const done = (query: { state: { data: Build[] | undefined } }) =>
    query.state.data !== undefined &&
    isEventDone(event, query.state.data, virtual);

  return useQuery({
    queryKey: keys.eventBuilds(event.id),
    queryFn: () => fetchEventBuilds(event.id),
    enabled: ready,
    refetchInterval: query =>
      poll && !done(query) ? config.buildReloadTimer : false,
    staleTime: query => (done(query) ? Infinity : 0),
    gcTime: EVENT_BUILDS_GC_MS,
    select: builds => builds
  });
}

/** One-off warm-up for cards about to scroll into view (no polling). */
export function prefetchEventBuilds(
  client: Pick<QueryClient, 'prefetchQuery'>,
  eventId: number
) {
  return client.prefetchQuery({
    queryKey: keys.eventBuilds(eventId),
    queryFn: () => fetchEventBuilds(eventId),
    staleTime: 10_000,
    gcTime: EVENT_BUILDS_GC_MS
  });
}

/**
 * The events worth warming for a rendered range: at most one batch above and one batch below it,
 * nearest first, never the range itself (those cards ask for their own builds).
 */
export function eventsToPrefetch<T>(
  events: T[],
  start: number,
  end: number,
  batch: number
): T[] {
  const below = events
    .slice(Math.max(0, start - batch), Math.max(0, start))
    .reverse();
  const above = events.slice(
    Math.max(0, end + 1),
    Math.max(0, end + 1 + batch)
  );

  return [...above, ...below];
}
