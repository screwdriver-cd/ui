import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Link,
  useNavigate,
  useParams,
  useRouterState
} from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Spinner } from 'react-bootstrap';
import { api } from '~/api/client';
import { config } from '~/config/config';
import { useSession } from '~/auth/session';
import { useT } from '~/i18n/useT';
import { useStartGuard } from '../hooks/useStartGuard';
import {
  fetchEvent,
  keys,
  useLastSuccessfulEvent,
  useLatestCommitEvent,
  usePrNums
} from '../api/queries';
import { usePipeline } from '../components/PipelineContext';
import {
  CARD_GRAPH_KINDS,
  type CardGraphKind
} from '../components/event/CardGraph';
import { EventRail } from '../components/event/EventRail';
import { StartEventModal } from '../components/event/StartEventModal';
import { WorkflowView } from '../components/WorkflowView';
import type { RailScope } from '../hooks/useEventRail';
import type { SdEvent } from '../types';
import { isDisabled, isInactive } from '../utils/pipeline';

type Mode = 'events' | 'pulls';

/** The newest event of the page's kind: where the index routes send you. */
function useNewestEvent(
  pipelineId: number,
  mode: Mode,
  filterScheduler: boolean,
  enabled: boolean,
  prNums?: number[]
) {
  const newestPr =
    prNums && prNums.length ? prNums[prNums.length - 1] : undefined;

  return useQuery({
    queryKey: ['newestEvent', pipelineId, mode, filterScheduler, newestPr],
    enabled: enabled && (mode === 'events' || newestPr !== undefined),
    staleTime: 0,
    // An empty pipeline keeps asking, so its first event opens without a reload (Ember
    // `monitorForNewEvents`). Pull requests already follow the polled PR list. A failed read
    // is asked again too: queries do not retry by default.
    refetchInterval: query =>
      query.state.data === null || query.state.status === 'error'
        ? config.eventReloadTimer
        : false,
    queryFn: async () => {
      const list = await api.get<SdEvent[]>(`/pipelines/${pipelineId}/events`, {
        query:
          mode === 'events'
            ? {
                count: 1,
                type: 'pipeline',
                sort: 'descending',
                creator: filterScheduler ? 'ne:sd:scheduler' : undefined
              }
            : { type: 'pr', prNum: newestPr }
      });

      return list[0] ?? null;
    }
  });
}

const CARD_GRAPH_KEY = 'sd.prototype.cardGraph';

/**
 * Prototype switch for the event-card graph: `?cardGraph=strip|ghost|grid|focus` turns it on (and is
 * remembered in this browser, since selecting a card drops the query), `?cardGraph=off` clears it.
 */
function useCardGraph(): CardGraphKind | undefined {
  const param = useRouterState({
    select: s => (s.location.search as { cardGraph?: string }).cardGraph
  });

  return useMemo(() => {
    const kind = (v: string | null | undefined) =>
      CARD_GRAPH_KINDS.find(k => k === v);

    try {
      if (kind(param)) localStorage.setItem(CARD_GRAPH_KEY, param as string);
      else if (param !== undefined) localStorage.removeItem(CARD_GRAPH_KEY);

      return kind(localStorage.getItem(CARD_GRAPH_KEY));
    } catch {
      return kind(param);
    }
  }, [param]);
}

/** A pipeline with no event yet: the only way to a first run is the rail's "Start New" (Ember keeps the rail here). */
function NoEvents({ mode, canStart }: { mode: Mode; canStart: boolean }) {
  const t = useT();
  const navigate = useNavigate();
  const { pipeline } = usePipeline();
  const [starting, setStarting] = useState(false);
  const checkScm = useStartGuard(pipeline);

  return (
    <div className="m-3">
      <p className="text-muted" id="no-events">
        {mode === 'pulls'
          ? t('pipeline.events.noPulls')
          : t('pipeline.events.none')}
      </p>
      {mode === 'events' && canStart ? (
        <Button
          id="start-event-button"
          variant="outline-primary"
          size="sm"
          title={t('pipeline.rail.startNew')}
          disabled={isInactive(pipeline) || isDisabled(pipeline)}
          onClick={() => checkScm() && setStarting(true)}
        >
          {t('pipeline.rail.startNew')}
        </Button>
      ) : null}
      {starting ? (
        <StartEventModal
          pipeline={pipeline}
          action="start"
          isPr={false}
          onClose={() => setStarting(false)}
          onStarted={created =>
            navigate({
              to: `/v2/pipelines/${pipeline.id}/events/${created.id}` as never
            })
          }
        />
      ) : null}
    </div>
  );
}

export function EventsPage({ mode }: { mode: Mode }) {
  const t = useT();
  const navigate = useNavigate();
  const { pipeline } = usePipeline();
  const params = useParams({ strict: false }) as { eventId?: string };
  const eventId = params.eventId ? Number(params.eventId) : undefined;
  const authenticated = useSession(s => s.isAuthenticated);
  const filterScheduler = Boolean(pipeline.settings?.filterSchedulerEvents);
  const prNums = usePrNums(pipeline.id, mode === 'pulls');
  const scope: RailScope = useMemo(
    () => ({
      pipelineId: pipeline.id,
      mode: mode === 'pulls' ? 'pr' : 'pipeline',
      filterScheduler: mode === 'events' && filterScheduler
    }),
    [pipeline.id, mode, filterScheduler]
  );
  const selectedQuery = useQuery({
    queryKey: keys.event(eventId ?? -1),
    queryFn: () => fetchEvent(eventId as number),
    enabled: eventId !== undefined,
    retry: false
  });
  // A pull request page only shows PR events; anything else points at the newest PR instead (as Ember does).
  const invalid =
    eventId !== undefined &&
    (selectedQuery.isError ||
      // An event of another pipeline is not this pipeline's event (Ember: "does not exist for this pipeline").
      (!!selectedQuery.data &&
        Number(selectedQuery.data.pipelineId) !== pipeline.id) ||
      (mode === 'pulls' &&
        !!selectedQuery.data &&
        selectedQuery.data.type !== 'pr'));
  const newest = useNewestEvent(
    pipeline.id,
    mode,
    filterScheduler,
    eventId === undefined || invalid,
    prNums.data
  );
  const lastSuccessful = useLastSuccessfulEvent(pipeline.id);
  const latestCommit = useLatestCommitEvent(pipeline.id, false);
  const queryClient = useQueryClient();
  const cardGraph = useCardGraph();
  // An event in view that succeeds after the page loaded takes the badge if it is newer (Ember `onEventUpdated`).
  const onStatus = useCallback(
    (event: SdEvent, status: string) => {
      const key = keys.lastSuccessfulEvent(pipeline.id);
      const current = queryClient.getQueryData<SdEvent | null>(key);

      if (
        status === 'SUCCESS' &&
        event.type !== 'pr' &&
        event.id > (current?.id ?? 0)
      ) {
        queryClient.setQueryData(key, event);
      }
    },
    [queryClient, pipeline.id]
  );

  // The index routes land on the newest event so the URL is always shareable.
  useEffect(() => {
    if (eventId === undefined && newest.data) {
      navigate({
        to: `/v2/pipelines/${pipeline.id}/${mode}/${newest.data.id}` as never,
        replace: true
      });
    }
  }, [eventId, newest.data, navigate, pipeline.id, mode]);

  const selected = invalid ? undefined : selectedQuery.data;
  const loading =
    eventId !== undefined
      ? selectedQuery.isPending && !selectedQuery.isError
      : (newest.isPending && newest.fetchStatus !== 'idle') ||
        (mode === 'pulls' && prNums.isPending);
  // Without the newest event (or the PR list) the page cannot tell an empty pipeline from a failure.
  const indexFailed =
    eventId === undefined &&
    !newest.data &&
    (newest.isError || (mode === 'pulls' && prNums.isError));

  let body;

  if (invalid) {
    body = (
      <Alert variant="warning" className="m-3" id="invalid-event">
        {t('pipeline.events.invalid', { id: eventId ?? '' })}
        {newest.data ? (
          <>
            {' '}
            <Link
              to={
                `/v2/pipelines/${pipeline.id}/${mode}/${newest.data.id}` as never
              }
              id="go-newest-event"
            >
              {t(
                mode === 'pulls'
                  ? 'pipeline.events.goNewestPull'
                  : 'pipeline.events.goNewest'
              )}
            </Link>
          </>
        ) : null}
      </Alert>
    );
  } else if (indexFailed) {
    body = (
      <Alert variant="danger" className="m-3" id="events-error">
        {t('common.error')}
      </Alert>
    );
  } else if (eventId === undefined && !loading && !newest.data) {
    body = <NoEvents mode={mode} canStart={authenticated} />;
  } else if (!selected) {
    body = (
      <div className="p-3" role="status">
        <Spinner size="sm" animation="border" /> {t('common.loading')}
      </div>
    );
  } else {
    body = (
      <div className="events-layout">
        <EventRail
          pipeline={pipeline}
          scope={scope}
          selected={selected}
          prNums={mode === 'pulls' ? prNums.data : undefined}
          lastSuccessfulEventId={lastSuccessful.data?.id}
          onStatus={onStatus}
          cardGraph={mode === 'events' ? cardGraph : undefined}
          latestCommitSha={latestCommit.data?.sha}
          latestCommitEventId={latestCommit.data?.id}
          allowEventAction={authenticated}
          showParameters={Boolean(
            pipeline.parameters && Object.keys(pipeline.parameters).length
          )}
          showEventGroup
          handleFilter
        />
        <div className="events-main" data-scroll-region="">
          <WorkflowView
            pipeline={pipeline}
            event={selected}
            mode={mode}
            allowEventAction={authenticated}
          />
        </div>
      </div>
    );
  }

  return body;
}

export const EventsIndexPage = () => <EventsPage mode="events" />;
export const PullsIndexPage = () => <EventsPage mode="pulls" />;
