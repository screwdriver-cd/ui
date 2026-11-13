import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useRef, useState, type ReactNode } from 'react';
import { Form } from 'react-bootstrap';
import { api } from '~/api/client';
import { useT } from '~/i18n/useT';
import { useStartGuard } from '../hooks/useStartGuard';
import { fetchEvent, keys } from '../api/queries';
import { setJobState } from '../api/mutations';
import type { Build, Job, Pipeline, SdEvent } from '../types';
import { ConfirmModal } from './ConfirmModal';
import { StartEventModal } from './event/StartEventModal';
import { StopEventModal } from './event/StopEventModal';

/**
 * Start / restart / stop / enable-disable for rows of a jobs table, with their modals. `event`: the
 * table shows one event (restart reruns the job in it); otherwise restart finds the event of the
 * job's latest build.
 */
export function useJobActions({
  pipeline,
  event,
  isPr = false
}: {
  pipeline: Pipeline;
  event?: SdEvent;
  isPr?: boolean;
}): {
  onStart: (job: Job, action: 'start' | 'restart', build?: Build) => void;
  onStop: (build: Build) => void;
  onToggleState: (job: Job) => void;
  modals: ReactNode;
} {
  const t = useT();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [start, setStart] = useState<{
    job: Job;
    action: 'start' | 'restart';
    event?: SdEvent;
    /** The latest build's status: FROZEN makes the modal a force start that needs a reason. */
    status?: string;
    /** Which click opened it: a new one remounts the modal, so no form state carries over. */
    request: number;
  } | null>(null);
  // Restart looks the event up first; only the latest click may open its modal.
  const request = useRef(0);
  const [stopping, setStopping] = useState<number | null>(null);
  const [target, setTarget] = useState<Job | null>(null);
  const [message, setMessage] = useState('');
  const canStart = useStartGuard(pipeline);

  const onStart = async (
    job: Job,
    action: 'start' | 'restart',
    build?: Build
  ) => {
    if (!canStart()) return;
    request.current += 1;
    const current = request.current;

    // A table of one event starts and restarts from that event (Ember: `record.event`).
    if (event) {
      setStart({
        job,
        action: build ? action : 'start',
        event,
        status: build?.status,
        request: current
      });

      return;
    }
    if (action === 'start' || !build) {
      setStart({
        job: { ...job },
        action,
        status: build?.status,
        request: current
      });

      return;
    }

    // Restart reruns the job in the event of its latest build.
    const eventId =
      build.eventId ??
      (build.meta?.build as { eventId?: number } | undefined)?.eventId ??
      (await api.get<Build>(`/builds/${build.id}`)).eventId;
    const buildEvent = eventId ? await fetchEvent(eventId) : undefined;

    if (buildEvent && current === request.current) {
      setStart({
        job,
        action,
        event: buildEvent,
        status: build.status,
        request: current
      });
    }
  };

  const modals = (
    <>
      {start ? (
        <StartEventModal
          key={start.request}
          pipeline={pipeline}
          event={start.event}
          job={{
            name: start.job.name,
            state: start.job.state,
            status: start.status
          }}
          action={start.action}
          isPr={isPr}
          onClose={() => setStart(null)}
          onStarted={created => {
            setStart(null);
            navigate({
              to: `/v2/pipelines/${pipeline.id}/${isPr ? 'pulls' : 'events'}/${
                created.id
              }` as never
            });
          }}
        />
      ) : null}
      {stopping ? (
        <StopEventModal buildId={stopping} onClose={() => setStopping(null)} />
      ) : null}
      {target ? (
        <ConfirmModal
          title={
            target.state === 'DISABLED'
              ? t('pipeline.jobs.enableTitle', { name: target.name })
              : t('pipeline.jobs.disableTitle', { name: target.name })
          }
          confirmLabel={
            target.state === 'DISABLED'
              ? t('pipeline.jobs.enable')
              : t('pipeline.jobs.disable')
          }
          onClose={() => setTarget(null)}
          onConfirm={async () => {
            await setJobState(
              target.id,
              target.state === 'DISABLED' ? 'ENABLED' : 'DISABLED',
              message
            );
            await queryClient.invalidateQueries({
              queryKey: keys.anyJobs(pipeline.id)
            });
            setTarget(null);
          }}
        >
          <Form.Group>
            <Form.Label>{t('pipeline.jobs.reason')}</Form.Label>
            <Form.Control
              value={message}
              onChange={e => setMessage(e.target.value)}
            />
          </Form.Group>
        </ConfirmModal>
      ) : null}
    </>
  );

  return {
    onStart: (job, action, build) => void onStart(job, action, build),
    onStop: build => setStopping(build.id),
    onToggleState: job => {
      setMessage('');
      setTarget(job);
    },
    modals
  };
}
