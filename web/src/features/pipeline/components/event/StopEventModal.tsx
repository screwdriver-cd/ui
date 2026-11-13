import { useQueryClient } from '@tanstack/react-query';
import { useT } from '~/i18n/useT';
import { stopBuild, stopEvent } from '../../api/mutations';
import { keys } from '../../api/queries';
import { ConfirmModal } from '../ConfirmModal';

interface Props {
  eventId?: number;
  buildId?: number;
  onClose: () => void;
}

export function StopEventModal({ eventId, buildId, onClose }: Props) {
  const t = useT();
  const queryClient = useQueryClient();

  return (
    <ConfirmModal
      id="stop-build-modal"
      variant="danger"
      title={t(
        eventId ? 'pipeline.stop.titleEvent' : 'pipeline.stop.titleBuild'
      )}
      confirmLabel={t('pipeline.stop.confirm')}
      pendingLabel={t('pipeline.stop.pending')}
      onClose={onClose}
      onConfirm={async () => {
        if (eventId) {
          await stopEvent(eventId);
          await queryClient.invalidateQueries({
            queryKey: keys.eventBuilds(eventId)
          });
        } else if (buildId) {
          await stopBuild(buildId);
          await queryClient.invalidateQueries({ queryKey: ['eventBuilds'] });
          await queryClient.invalidateQueries({ queryKey: ['jobBuilds'] });
        }
        onClose();
      }}
    >
      <p>
        {t(eventId ? 'pipeline.stop.bodyEvent' : 'pipeline.stop.bodyBuild')}
      </p>
    </ConfirmModal>
  );
}
