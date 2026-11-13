import { Icon } from '~/components/Icon';
import { assetUrl } from '~/config/config';
import { useNavigate } from '@tanstack/react-router';
import {
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent
} from 'react';
import { Button } from 'react-bootstrap';
import { useT } from '~/i18n/useT';
import { useStartGuard } from '../../hooks/useStartGuard';
import { keys, useJobs, useUserSettings } from '../../api/queries';
import { useQueryClient } from '@tanstack/react-query';
import { useEventBuilds, virtualJobIdsOf } from '../../hooks/useEventBuilds';
import { useFormatDateTime } from '../../hooks/useFormat';
import { notifyBuildStatus, shouldNotify } from '../../utils/notify';
import type { Build, Pipeline, SdEvent } from '../../types';
import {
  eventTitle,
  formatShortDuration,
  getDuration,
  getExternalPipelineId,
  getFailureCount,
  getFirstCreateTime,
  getStatus,
  getSuccessCount,
  getWarningCount,
  isCommitterDifferent,
  isComplete,
  isExternalTrigger,
  isSkipped,
  truncate,
  truncatedSha
} from '../../utils/event';
import { isDisabled, isInactive } from '../../utils/pipeline';
import { StatusIcon } from '../StatusIcon';
import { frameStatus, useCardFrame } from '../../hooks/useCardFrame';
import {
  CardFocusGraph,
  CardGhostGraph,
  CardGridGraph,
  CardStrip,
  type CardGraphKind
} from './CardGraph';
import { EventHistoryModal } from './EventHistoryModal';
import { ParametersModal } from './ParametersModal';
import { StartEventModal } from './StartEventModal';
import { StopEventModal } from './StopEventModal';

/** A card must stay mounted this long before it asks for its builds. */
export const CARD_BUILDS_DELAY_MS = 80;

export interface EventCardProps {
  pipeline: Pipeline;
  event: SdEvent;
  /** Id of the event shown on the page (gets the `highlighted` class). */
  selectedId?: number;
  lastSuccessfulEventId?: number;
  latestCommitSha?: string;
  allowEventAction?: boolean;
  showParameters?: boolean;
  showEventGroup?: boolean;
  /** Hide cards without builds when the pipeline setting asks for it. */
  handleFilter?: boolean;
  onSelect?: (event: SdEvent) => void;
  onStatus?: (event: SdEvent, status: string) => void;
  /** Prototype: draw what ran into the pipeline's graph (`?cardGraph=strip|ghost|grid|focus`). */
  cardGraph?: CardGraphKind;
}

export interface CardState {
  status: string;
  aggregateStatus: string;
  failures: number;
  warnings: number;
  successes: number;
  complete: boolean;
  skipped: boolean;
  builds: Build[];
}

/** Derives everything the card shows from the event and its (polled) builds. */
export function deriveCardState(
  event: SdEvent,
  builds: Build[] | undefined,
  previous: Build[] | undefined,
  virtualJobIds: Set<number>
): CardState {
  const skipped = isSkipped(event, builds);
  const complete =
    isComplete(builds, previous ?? builds, virtualJobIds) || !builds?.length;
  const status = getStatus(builds, skipped, complete);
  const list = builds ?? [];
  const failures = getFailureCount(list);
  const warnings = getWarningCount(list);

  return {
    status,
    aggregateStatus:
      failures > 0 ? 'FAILURE' : warnings > 0 ? 'WARNING' : status,
    failures,
    warnings,
    successes: getSuccessCount(list),
    complete: skipped || complete,
    skipped,
    builds: list
  };
}

function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active) {
      return undefined;
    }

    const id = setInterval(() => setNow(Date.now()), 1000);

    return () => clearInterval(id);
  }, [active]);

  return now;
}

function EventCardImpl({
  pipeline,
  event,
  selectedId,
  lastSuccessfulEventId,
  latestCommitSha,
  allowEventAction,
  showParameters,
  showEventGroup,
  handleFilter,
  onSelect,
  onStatus,
  cardGraph
}: EventCardProps) {
  const t = useT();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const format = useFormatDateTime();
  const jobs = useJobs(event.pipelineId, 'pipeline');
  const virtualJobIds = useMemo(() => virtualJobIdsOf(jobs.data), [jobs.data]);
  const buildsQuery = useEventBuilds(event, { delayMs: CARD_BUILDS_DELAY_MS });
  const previousRef = useRef<Build[] | undefined>(undefined);
  const lastSeen = useRef<Build[] | undefined>(undefined);

  // The query cache holds only the current builds; keep the one before it for `isComplete`.
  if (buildsQuery.data !== lastSeen.current) {
    previousRef.current = lastSeen.current;
    lastSeen.current = buildsQuery.data;
  }

  const state = deriveCardState(
    event,
    buildsQuery.data,
    previousRef.current,
    virtualJobIds
  );
  const isPr = event.type === 'pr';
  // PR builds run PR copies of the jobs, which are not in the pipeline's graph.
  const frame = useCardFrame(
    cardGraph && !isPr ? pipeline.workflowGraph : undefined
  );
  const graphStatus = useMemo(
    () => (frame ? frameStatus(frame, state.builds, virtualJobIds) : null),
    [frame, state.builds, virtualJobIds]
  );
  const highlighted = selectedId !== undefined && selectedId === event.id;
  const now = useNow(!state.complete && state.builds.length > 0);
  const startedAt = getFirstCreateTime(state.builds);
  const durationText = state.complete
    ? formatShortDuration(getDuration(state.builds, virtualJobIds))
    : startedAt
      ? formatShortDuration(now - startedAt)
      : '';
  const canStart = useStartGuard(pipeline);
  const [modal, setModal] = useState<
    'abort' | 'start' | 'params' | 'history' | null
  >(null);
  const filtered = Boolean(
    handleFilter &&
      pipeline.settings?.filterEventsForNoBuilds &&
      !highlighted &&
      state.status === 'SKIPPED'
  );
  const different = isCommitterDifferent(event);
  const externalId = getExternalPipelineId(event);

  useEffect(() => {
    onStatus?.(event, state.status);
  }, [onStatus, event, state.status]);

  // Preferences > "allow notifications": a desktop notification when this event finishes.
  const allowNotification = useUserSettings().data?.allowNotification === true;
  const lastStatus = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (shouldNotify(lastStatus.current, state.status, allowNotification)) {
      notifyBuildStatus(pipeline.name, event.id, state.status);
    }
    lastStatus.current = state.status;
  }, [state.status, allowNotification, pipeline.name, event.id]);

  const eventPath = `/v2/pipelines/${event.pipelineId}/${
    isPr ? 'pulls' : 'events'
  }/${event.id}`;
  const select = () => {
    onSelect?.(event);
    // The event is already on screen: seed the page's lookup so it does not swap the rail for a spinner.
    if (queryClient.getQueryData(keys.event(event.id)) === undefined) {
      queryClient.setQueryData(keys.event(event.id), event);
    }
  };
  const go = (e: MouseEvent) => {
    if ((e.target as HTMLElement).closest('a, button')) {
      e.stopPropagation();

      return;
    }
    if (highlighted) {
      return;
    }
    select();
    navigate({ to: eventPath });
  };

  const person = (name?: string, url?: string) =>
    url ? (
      <a href={url} target="_blank" rel="noreferrer">
        {name}
      </a>
    ) : (
      <span>{name}</span>
    );

  return (
    <div
      className={`event-card${highlighted ? ' highlighted' : ''}${
        filtered ? ' filtered' : ''
      }`}
      title={eventTitle(event)}
      aria-current={highlighted ? 'true' : undefined}
      data-event-id={event.id}
      data-status={state.status}
      onClick={go}
    >
      <div className="event-card-title">
        <div className={`event-status ${state.aggregateStatus}`}>
          <StatusIcon status={state.status} />
        </div>
        {isPr ? (
          <div className="pr-title" title={`PR-${event.prNum}`}>
            <a href={event.pr?.url} target="_blank" rel="noreferrer">
              PR-{event.prNum}
            </a>
          </div>
        ) : null}
        <div className="sha" title={`#${truncatedSha(event.sha)}`}>
          <a
            className={
              latestCommitSha && latestCommitSha === event.sha
                ? 'latest-commit'
                : undefined
            }
            href={event.commit.url}
            target="_blank"
            rel="noreferrer"
          >
            #{truncatedSha(event.sha)}
          </a>
        </div>
        {lastSuccessfulEventId === event.id && !isPr ? (
          <div className="last-successful">
            {t('pipeline.card.lastSuccessful')}
          </div>
        ) : null}
        {state.status === 'RUNNING' ? (
          allowEventAction ? (
            <Button
              size="sm"
              variant="outline-danger"
              className="abort-event-button"
              title={t('pipeline.card.abort')}
              aria-label={t('pipeline.card.abort')}
              onClick={() => setModal('abort')}
            >
              <Icon name="circleStop" />
            </Button>
          ) : null
        ) : allowEventAction && isPr ? (
          <Button
            size="sm"
            variant="outline-primary"
            className="start-event-button"
            title={t('pipeline.card.startPr')}
            aria-label={t('pipeline.card.startPr')}
            disabled={isInactive(pipeline) || isDisabled(pipeline)}
            onClick={() => canStart() && setModal('start')}
          >
            <Icon name="circlePlay" />
          </Button>
        ) : null}
      </div>

      <div className="event-card-body">
        {event.startFrom?.startsWith('~pr-closed') ? (
          <div className="message" title={event.causeMessage}>
            {event.causeMessage}
          </div>
        ) : (
          <div className="message" title={event.commit.message}>
            {truncate(event.commit.message, 150)}
          </div>
        )}
        {event.meta?.label ? (
          <div className="label" title={event.meta.label}>
            <span className="label-contents">{event.meta.label}</span>
          </div>
        ) : null}
        <div className="by">
          {different ? (
            <>
              <div>
                {t('pipeline.card.committedBy')}{' '}
                {person(event.commit.author?.name, event.commit.author?.url)}
              </div>
              <div>
                {t('pipeline.card.startedBy')}{' '}
                {isExternalTrigger(event) && externalId ? (
                  <a href={assetUrl(`/v2/pipelines/${externalId}`)}>
                    {t('pipeline.card.externalTrigger')}
                  </a>
                ) : (
                  person(event.creator?.name, event.creator?.url)
                )}
              </div>
            </>
          ) : event.meta?.subscribedSourceUrl ? (
            <div>
              {t('pipeline.card.startedBySubscribed')}{' '}
              <a
                href={event.meta.subscribedSourceUrl}
                target="_blank"
                rel="noreferrer"
              >
                {t('pipeline.card.subscribedSource')}
              </a>
            </div>
          ) : (
            <div>
              {t('pipeline.card.startedAndCommittedBy')}{' '}
              {person(event.creator?.name, event.creator?.url)}
            </div>
          )}
        </div>
        <div className="time">
          <div>
            {t('pipeline.card.started', { date: format(event.createTime) })}
          </div>
          <div>{t('pipeline.card.duration', { duration: durationText })}</div>
        </div>
        <div className="event-id-row">
          {/* The card's click target for keyboard users; a modified click opens a new tab. */}
          <a
            className="event-id"
            href={assetUrl(eventPath)}
            onClick={e => {
              if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
                return;
              }
              e.preventDefault();
              if (!highlighted) {
                select();
                navigate({ to: eventPath });
              }
            }}
          >
            {t('pipeline.card.eventId', { id: event.id })}
          </a>
        </div>
      </div>

      {frame && graphStatus ? (
        cardGraph === 'focus' ? (
          <CardFocusGraph
            frame={frame}
            status={graphStatus}
            startFrom={event.startFrom}
            virtualJobIds={virtualJobIds}
          />
        ) : cardGraph === 'grid' ? (
          <CardGridGraph
            frame={frame}
            status={graphStatus}
            virtualJobIds={virtualJobIds}
          />
        ) : cardGraph === 'ghost' ? (
          <CardGhostGraph
            frame={frame}
            status={graphStatus}
            virtualJobIds={virtualJobIds}
          />
        ) : (
          <CardStrip
            frame={frame}
            status={graphStatus}
            virtualJobIds={virtualJobIds}
          />
        )
      ) : null}

      <div className="event-card-footer">
        <div className="counts">
          {state.failures > 0 ? (
            <div className="count failures" title={t('pipeline.card.failures')}>
              <Icon name="circleXmark" /> {state.failures}
            </div>
          ) : null}
          {state.warnings > 0 ? (
            <div className="count warnings" title={t('pipeline.card.warnings')}>
              <Icon name="circleExclamation" /> {state.warnings}
            </div>
          ) : null}
          {state.successes > 0 ? (
            <div
              className="count successes"
              title={t('pipeline.card.successes')}
            >
              <Icon name="circleCheck" /> {state.successes}
            </div>
          ) : null}
        </div>
        <div className="event-buttons">
          {showParameters && event.meta?.parameters ? (
            <Button
              size="sm"
              variant="outline-primary"
              className="parameters-button"
              title={t('pipeline.card.parameters')}
              aria-label={t('pipeline.card.parameters')}
              onClick={() => setModal('params')}
            >
              <Icon name="gear" />
            </Button>
          ) : null}
          {showEventGroup ? (
            <Button
              size="sm"
              variant="outline-primary"
              className="event-group-button"
              title={
                isPr
                  ? t('pipeline.card.historyPr', { prNum: event.prNum })
                  : t('pipeline.card.history', {
                      id: event.parentEventId ?? event.groupEventId
                    })
              }
              aria-label={t('pipeline.card.historyAria')}
              onClick={() => setModal('history')}
            >
              <Icon name="history" />
            </Button>
          ) : null}
        </div>
      </div>

      {modal === 'abort' ? (
        <StopEventModal eventId={event.id} onClose={() => setModal(null)} />
      ) : null}
      {modal === 'start' ? (
        <StartEventModal
          pipeline={pipeline}
          event={event}
          action="start"
          isPr
          onClose={() => setModal(null)}
          onStarted={created =>
            navigate({
              to: `/v2/pipelines/${created.pipelineId}/pulls/${created.id}`
            })
          }
        />
      ) : null}
      {modal === 'params' ? (
        <ParametersModal event={event} onClose={() => setModal(null)} />
      ) : null}
      {modal === 'history' ? (
        <EventHistoryModal
          pipeline={pipeline}
          event={event}
          lastSuccessfulEventId={lastSuccessfulEventId}
          latestCommitSha={latestCommitSha}
          allowEventAction={allowEventAction}
          onClose={() => setModal(null)}
        />
      ) : null}
    </div>
  );
}

export const EventCard = memo(EventCardImpl);
