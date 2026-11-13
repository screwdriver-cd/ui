import { Icon } from '~/components/Icon';
import { statusIconSpec } from '~/components/status-icon';
import { useT } from '~/i18n/useT';
import type { StatusGlyph as Glyph, StatusTone } from '../lib/metrics';
import styles from '../collections.module.scss';

const STATUS: Record<Glyph, string> = {
  running: 'RUNNING',
  success: 'SUCCESS',
  failure: 'FAILURE',
  aborted: 'ABORTED',
  blocked: 'BLOCKED',
  unstable: 'UNSTABLE',
  frozen: 'FROZEN',
  unknown: 'UNKNOWN'
};

export function StatusGlyph({
  glyph,
  tone
}: {
  glyph: Glyph;
  tone: StatusTone;
}) {
  const t = useT();
  const { name, spin, flip } = statusIconSpec(STATUS[glyph]);

  return (
    <span
      className={`sd-status-icon ${glyph} ${styles[`tone-${tone}`] ?? ''}`}
      role="img"
      aria-label={t(`collections.status.${glyph}`)}
      data-status={glyph}
    >
      <Icon name={name} spin={spin} flip={flip} />
    </span>
  );
}
