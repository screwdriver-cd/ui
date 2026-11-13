import { Icon } from '~/components/Icon';
import { statusIconSpec } from '~/components/status-icon';
import { useT } from '~/i18n/useT';

export function StatusIcon({
  status = 'UNKNOWN',
  light = false,
  virtual = false
}: {
  status?: string;
  light?: boolean;
  virtual?: boolean;
}) {
  const t = useT();
  const { name, spin, flip } = statusIconSpec(status, { light, virtual });

  return (
    <span
      className={`sd-status-icon ${status}`}
      role="img"
      aria-label={t('pipeline.status.label', { status })}
    >
      <Icon name={name} spin={spin} flip={flip} />
    </span>
  );
}
