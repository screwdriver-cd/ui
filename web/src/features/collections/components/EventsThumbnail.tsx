import { Link } from '@tanstack/react-router';
import { useT } from '~/i18n/useT';
import type { EventBar } from '../lib/metrics';
import { pipelineEventsPath } from '../lib/links';
import styles from '../collections.module.scss';

const MAX_BARS = 20;
const HEIGHT = 40;
const BAR = 6;
const GAP = 3;

/** Last 20 events as bars: height is duration, colour is status (oldest on the left). */
export function EventsThumbnail({
  events,
  pipelineId
}: {
  events: EventBar[];
  pipelineId: number;
}) {
  const t = useT();
  const bars = [...events].reverse();
  const max = Math.max(1, ...events.map(event => event.duration));
  const padded: EventBar[] = [
    ...Array.from({ length: Math.max(0, MAX_BARS - bars.length) }, () => ({
      duration: 0,
      tone: 'empty' as const
    })),
    ...bars
  ].slice(-MAX_BARS);

  return (
    <Link
      to={pipelineEventsPath(pipelineId)}
      aria-label={t('collections.thumbnail.label')}
    >
      <svg
        className={styles.thumb}
        viewBox={`0 0 ${MAX_BARS * (BAR + GAP)} ${HEIGHT}`}
        preserveAspectRatio="none"
        data-testid="events-thumbnail"
        aria-hidden="true"
      >
        {padded.map((bar, index) => {
          const height = bar.duration
            ? Math.max(3, (bar.duration / max) * HEIGHT)
            : 2;

          return (
            <rect
              key={index}
              className={styles[`tone-${bar.tone}`]}
              x={index * (BAR + GAP)}
              y={HEIGHT - height}
              width={BAR}
              height={height}
            />
          );
        })}
      </svg>
    </Link>
  );
}
