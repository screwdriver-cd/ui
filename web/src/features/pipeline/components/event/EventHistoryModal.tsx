import { useQuery } from '@tanstack/react-query';
import { Alert, Button, Modal, Spinner } from 'react-bootstrap';
import { api } from '~/api/client';
import { useT } from '~/i18n/useT';
import type { Pipeline, SdEvent } from '../../types';
import { EventCard } from './EventCard';

/** Every event in the same group (or every event of the PR), newest first. */
export function EventHistoryModal({
  pipeline,
  event,
  lastSuccessfulEventId,
  latestCommitSha,
  allowEventAction,
  onClose
}: {
  pipeline: Pipeline;
  event: SdEvent;
  lastSuccessfulEventId?: number;
  latestCommitSha?: string;
  allowEventAction?: boolean;
  onClose: () => void;
}) {
  const t = useT();
  const isPr = event.type === 'pr';
  const groupId = event.groupEventId;
  const history = useQuery({
    queryKey: [
      'eventHistory',
      event.pipelineId,
      isPr ? `pr${event.prNum}` : groupId
    ],
    queryFn: () =>
      api.get<SdEvent[]>(`/pipelines/${event.pipelineId}/events`, {
        query: isPr
          ? { prNum: event.prNum }
          : { groupEventId: event.groupEventId }
      })
  });

  return (
    <Modal
      show
      onHide={onClose}
      centered
      className="pipeline-modal"
      id="show-event-group-modal"
    >
      <Modal.Header closeButton>
        <Modal.Title as="div">
          {isPr
            ? t('pipeline.history.titlePr', { prNum: event.prNum })
            : t('pipeline.history.title', { id: groupId })}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {history.isLoading ? <Spinner size="sm" /> : null}
        {history.isError ? (
          <Alert variant="danger" className="py-1">
            {t('common.error')}{' '}
            <Button
              variant="link"
              size="sm"
              className="p-0 align-baseline"
              onClick={() => void history.refetch()}
            >
              {t('common.retry')}
            </Button>
          </Alert>
        ) : null}
        {(history.data ?? []).map(item => (
          <EventCard
            key={item.id}
            pipeline={pipeline}
            event={item}
            selectedId={event.id}
            lastSuccessfulEventId={lastSuccessfulEventId}
            latestCommitSha={latestCommitSha}
            allowEventAction={allowEventAction}
            onSelect={onClose}
          />
        ))}
      </Modal.Body>
    </Modal>
  );
}
