import { Icon } from '~/components/Icon';
import { useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes
} from 'react';
import { Alert, Button, Spinner } from 'react-bootstrap';
import { Virtuoso, type ListRange, type VirtuosoHandle } from 'react-virtuoso';
import { useT } from '~/i18n/useT';
import { useStartGuard } from '../../hooks/useStartGuard';
import {
  EVENT_BATCH_SIZE,
  nextFirstItemIndex,
  useEventRail,
  type RailScope
} from '../../hooks/useEventRail';
import {
  eventsToPrefetch,
  prefetchEventBuilds
} from '../../hooks/useEventBuilds';
import type { Pipeline, SdEvent } from '../../types';
import { isDisabled, isInactive } from '../../utils/pipeline';
import {
  CARD_BUILDS_DELAY_MS,
  EventCard,
  type EventCardProps
} from './EventCard';
import { SearchEventModal } from './SearchEventModal';
import { StartEventModal } from './StartEventModal';

/** Virtuoso needs an index space it can prepend into without going negative. */
const INDEX_BASE = 1_000_000;
/** PR mode: cards either side of the visible range whose PRs are kept up to date too. */
const PR_REFRESH_BUFFER = 5;

type CardContext = Pick<
  EventCardProps,
  | 'pipeline'
  | 'selectedId'
  | 'lastSuccessfulEventId'
  | 'latestCommitSha'
  | 'allowEventAction'
  | 'showParameters'
  | 'showEventGroup'
  | 'handleFilter'
  | 'onSelect'
  | 'onStatus'
  | 'cardGraph'
>;

// Defined at module level so Virtuoso does not remount the scroller on every render.
const Scroller = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function Scroller(props, ref) {
    return <div {...props} ref={ref} id="event-cards-container" />;
  }
);

export interface EventRailProps extends Omit<CardContext, 'selectedId'> {
  pipeline: Pipeline;
  scope: RailScope;
  /** The event the page is showing (deep-link target). */
  selected: SdEvent;
  prNums?: number[];
  /** The newest event of the branch head commit (API `latestCommitEvent`), to jump to. */
  latestCommitEventId?: number;
  className?: string;
  /** Pages kept in memory (see RAIL_MAX_PAGES). */
  maxPages?: number;
}

export function EventRail({
  scope,
  selected,
  prNums,
  latestCommitEventId,
  className = '',
  maxPages,
  ...card
}: EventRailProps) {
  const t = useT();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const prefetchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [modal, setModal] = useState<'search' | 'start' | null>(null);
  const canStart = useStartGuard(card.pipeline);
  const isPr = scope.mode === 'pr';
  const [anchor, setAnchor] = useState(selected);
  const [atTop, setAtTop] = useState(true);
  const virtuoso = useRef<VirtuosoHandle>(null);
  const rail = useEventRail({ scope, anchor, prNums, atTop, maxPages });
  const {
    events,
    aboveAnchor,
    fetchNextPage,
    fetchPreviousPage,
    hasNextPage,
    hasPreviousPage,
    setVisiblePrs
  } = rail;
  const busy = useRef({ next: false, prev: false });
  // Virtuoso's index space: prepending lowers the first index, trimming raises it, so scroll stays put.
  const indexWindow = useRef({
    anchorId: anchor.id,
    ids: [] as number[],
    first: INDEX_BASE
  });
  const firstItemIndex = useMemo(() => {
    const ids = events.map(e => e.id);
    const current = indexWindow.current;
    const first =
      current.anchorId === anchor.id
        ? nextFirstItemIndex(current.ids, ids, current.first)
        : INDEX_BASE;

    indexWindow.current = { anchorId: anchor.id, ids, first };

    return first;
  }, [events, anchor.id]);
  const [initialIndex, setInitialIndex] = useState<number | null>(null);

  // Deep link to an event the rail has not loaded (typed URL, other group): re-anchor on it.
  // An event that was loaded and then trimmed out of the page window is not a navigation: leave the list alone.
  const seenSelected = useRef<number | null>(selected.id);

  useEffect(() => {
    if (rail.isLoading || events.length === 0) {
      return;
    }
    if (events.some(e => e.id === selected.id)) {
      seenSelected.current = selected.id;

      return;
    }
    if (seenSelected.current !== selected.id) {
      seenSelected.current = selected.id;
      setAnchor(selected);
      setInitialIndex(null);
      setAtTop(true);
    }
  }, [rail.isLoading, events, selected]);

  // The starting position is fixed once, from the first load of this anchor.
  useEffect(() => {
    if (initialIndex === null && events.length > 0) {
      setInitialIndex(aboveAnchor);
    }
  }, [initialIndex, events.length, aboveAnchor]);

  // New events were prepended while the user was at the top: stay at the top.
  const lastMerged = useRef(rail.mergedVersion);

  useEffect(() => {
    if (rail.mergedVersion !== lastMerged.current) {
      lastMerged.current = rail.mergedVersion;
      virtuoso.current?.scrollToIndex({ index: 0, align: 'start' });
    }
  }, [rail.mergedVersion]);

  const onRange = useCallback(
    ({ startIndex, endIndex }: ListRange) => {
      const first = firstItemIndex;
      const start = startIndex >= first ? startIndex - first : startIndex;
      const end = endIndex >= first ? endIndex - first : endIndex;

      // Warm the cards just outside the range once it has held still as long as a card waits.
      clearTimeout(prefetchTimer.current);
      prefetchTimer.current = setTimeout(() => {
        eventsToPrefetch(events, start, end, EVENT_BATCH_SIZE).forEach(
          e => void prefetchEventBuilds(queryClient, e.id)
        );
        if (isPr) {
          setVisiblePrs(
            [
              ...events.slice(Math.max(0, start), end + 1),
              ...eventsToPrefetch(events, start, end, PR_REFRESH_BUFFER)
            ]
              .map(e => Number(e.prNum))
              .filter(n => !Number.isNaN(n))
          );
        }
      }, CARD_BUILDS_DELAY_MS);

      if (
        hasNextPage &&
        end >= events.length - 1 - EVENT_BATCH_SIZE / 2 &&
        !busy.current.next
      ) {
        busy.current.next = true;
        fetchNextPage().finally(() => {
          busy.current.next = false;
        });
      }
      if (
        hasPreviousPage &&
        start <= EVENT_BATCH_SIZE / 2 &&
        !busy.current.prev
      ) {
        busy.current.prev = true;
        fetchPreviousPage().finally(() => {
          busy.current.prev = false;
        });
      }
    },
    [
      firstItemIndex,
      events,
      isPr,
      setVisiblePrs,
      queryClient,
      hasNextPage,
      hasPreviousPage,
      fetchNextPage,
      fetchPreviousPage
    ]
  );

  useEffect(() => () => clearTimeout(prefetchTimer.current), []);

  const showPending = async () => {
    await rail.showPending();
    virtuoso.current?.scrollToIndex({ index: 0, align: 'start' });
  };

  const context: CardContext = { ...card, selectedId: selected.id };

  // A loaded event is scrolled into view; any other re-anchors the rail on it once selected.
  const jumpTo = (id: number) => {
    const index = events.findIndex(e => e.id === id);

    if (index >= 0) {
      virtuoso.current?.scrollToIndex({ index, align: 'center' });
    }
  };
  const jumps = isPr
    ? []
    : [
        {
          id: 'last-successful-event-button',
          eventId: card.lastSuccessfulEventId,
          label: t('pipeline.rail.lastSuccessful'),
          icon: 'circleCheck' as const
        },
        {
          id: 'latest-commit-event-button',
          eventId: latestCommitEventId,
          label: t('pipeline.rail.latestCommit'),
          icon: 'codeBranch' as const
        }
      ];

  return (
    <div id="event-rail" className={`event-rail ${className}`.trim()}>
      <div id="event-rail-actions" className="event-rail-actions">
        <Button
          id="search-for-event-button"
          variant="outline-primary"
          title={t('pipeline.search.open')}
          aria-label={t('pipeline.search.open')}
          disabled={rail.isLoading}
          onClick={() => setModal('search')}
        >
          <Icon name="magnifyingGlass" />
        </Button>
        {jumps.map(jump =>
          jump.eventId ? (
            <Link
              key={jump.id}
              id={jump.id}
              className="btn btn-outline-primary event-rail-jump"
              to={
                `/v2/pipelines/${card.pipeline.id}/events/${jump.eventId}` as never
              }
              title={jump.label}
              aria-label={jump.label}
              onClick={() => jumpTo(jump.eventId as number)}
            >
              <Icon name={jump.icon} />
            </Link>
          ) : null
        )}
        {!isPr && card.allowEventAction ? (
          <Button
            id="start-event-button"
            variant="outline-primary"
            className="ms-auto"
            title={t('pipeline.rail.startNew')}
            disabled={isInactive(card.pipeline) || isDisabled(card.pipeline)}
            onClick={() => canStart() && setModal('start')}
          >
            {t('pipeline.rail.startNew')}
          </Button>
        ) : null}
      </div>
      {rail.pendingCount > 0 && !atTop ? (
        <Button
          id="new-events-pill"
          className="new-events-pill"
          size="sm"
          variant="primary"
          onClick={showPending}
        >
          {t('pipeline.rail.newEvents', { count: rail.pendingCount })}
        </Button>
      ) : null}
      {rail.isError ? (
        <Alert variant="danger" className="m-2">
          {t('pipeline.rail.error')}
        </Alert>
      ) : null}
      {rail.isLoading || initialIndex === null ? (
        <div className="event-rail-loading" role="status">
          <Spinner size="sm" animation="border" /> {t('common.loading')}
        </div>
      ) : (
        <Virtuoso<SdEvent, CardContext>
          key={anchor.id}
          ref={virtuoso}
          style={{ flex: 1, minHeight: 0 }}
          data={events}
          context={context}
          firstItemIndex={firstItemIndex}
          initialTopMostItemIndex={{ index: initialIndex, align: 'start' }}
          computeItemKey={(_, event) => event.id}
          increaseViewportBy={{ top: 300, bottom: 600 }}
          rangeChanged={onRange}
          atTopStateChange={setAtTop}
          atTopThreshold={8}
          components={{ Scroller }}
          itemContent={(_, event, ctx) => <EventCard event={event} {...ctx} />}
        />
      )}
      {rail.isFetchingPreviousPage ? (
        <div className="event-rail-fetching top" aria-hidden="true">
          <Spinner size="sm" animation="border" />
        </div>
      ) : null}
      {rail.isFetchingNextPage ? (
        <div className="event-rail-fetching bottom" aria-hidden="true">
          <Spinner size="sm" animation="border" />
        </div>
      ) : null}
      {modal === 'search' ? (
        <SearchEventModal
          pipeline={card.pipeline}
          isPr={isPr}
          lastSuccessfulEventId={card.lastSuccessfulEventId}
          latestCommitSha={card.latestCommitSha}
          allowEventAction={card.allowEventAction}
          onClose={() => setModal(null)}
        />
      ) : null}
      {modal === 'start' ? (
        <StartEventModal
          pipeline={card.pipeline}
          action="start"
          isPr={false}
          onClose={() => setModal(null)}
          onStarted={created =>
            navigate({
              to: `/v2/pipelines/${card.pipeline.id}/events/${created.id}` as never
            })
          }
        />
      ) : null}
    </div>
  );
}
