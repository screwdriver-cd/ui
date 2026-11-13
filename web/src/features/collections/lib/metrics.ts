import type { EventMetric } from './types';

export type StatusTone =
  | 'running'
  | 'success'
  | 'failure'
  | 'unstable'
  | 'warning'
  | 'frozen'
  | 'unknown'
  | 'empty';

export type StatusGlyph = 'running' | 'success' | 'failure' | 'aborted' | 'blocked' | 'unstable' | 'frozen' | 'unknown';

export function getGlyph(status: string): StatusGlyph {
  switch (status) {
    case 'queued':
    case 'running':
      return 'running';
    case 'success':
    case 'warning':
      return 'success';
    case 'failure':
      return 'failure';
    case 'aborted':
      return 'aborted';
    case 'blocked':
      return 'blocked';
    case 'unstable':
      return 'unstable';
    case 'frozen':
      return 'frozen';
    default:
      return 'unknown';
  }
}

export function getTone(status: string): StatusTone {
  switch (status) {
    case 'queued':
    case 'running':
    case 'blocked':
      return 'running';
    case 'success':
      return 'success';
    case 'failure':
    case 'aborted':
      return 'failure';
    case 'unstable':
      return 'unstable';
    case 'warning':
      return 'warning';
    case 'frozen':
      return 'frozen';
    default:
      return 'unknown';
  }
}

/** Same output as app/utils/metric.js formatTime. */
export function formatDuration(totalSeconds: number): string {
  const minute = 60;
  const hour = 60 * minute;

  if (totalSeconds === 0) {
    return '0s';
  }
  if (totalSeconds < minute) {
    return `${totalSeconds}s`;
  }
  if (totalSeconds < hour) {
    return `${Math.floor(totalSeconds / minute)}m ${totalSeconds % minute}s`;
  }

  const hours = Math.floor(totalSeconds / hour);
  const minutes = Math.floor((totalSeconds % hour) / minute);
  const seconds = Math.floor(totalSeconds % minute);

  return `${hours}h ${minutes}m ${seconds}s`;
}

export interface EventBar {
  duration: number;
  tone: StatusTone;
}

export interface LastEventInfo {
  empty: boolean;
  status: string;
  tone: StatusTone;
  glyph: StatusGlyph;
  createTime: string | null;
  duration: number;
  durationText: string;
  sha: string | null;
  commitMessage: string | null;
  commitUrl: string | null;
}

export interface FormattedMetrics {
  eventsInfo: EventBar[];
  lastEventInfo: LastEventInfo;
}

const withWarning = (metric: EventMetric, status: string) =>
  status === 'success' && metric.builds?.some(build => build?.meta?.build?.warning) ? 'warning' : status;

/** Port of app/utils/metric.js formatMetrics (language-neutral data only). */
export function formatMetrics(metrics: EventMetric[] | undefined): FormattedMetrics {
  if (!metrics || metrics.length === 0) {
    return {
      eventsInfo: [],
      lastEventInfo: {
        empty: true,
        status: 'build-empty',
        tone: 'empty',
        glyph: 'unknown',
        createTime: null,
        duration: 0,
        durationText: '--',
        sha: null,
        commitMessage: null,
        commitUrl: null
      }
    };
  }

  const [last] = metrics as [EventMetric];
  const eventsInfo = metrics.map(metric => ({
    duration: metric.duration || 0,
    tone: getTone(withWarning(metric, metric.status.toLowerCase()))
  }));
  const rawStatus = last.status.toLowerCase();
  const status = withWarning(last, rawStatus);

  return {
    eventsInfo,
    lastEventInfo: {
      empty: false,
      status: rawStatus,
      tone: getTone(status),
      glyph: getGlyph(rawStatus),
      createTime: last.createTime,
      duration: last.duration || 0,
      durationText: last.duration ? formatDuration(last.duration) : '--',
      sha: last.sha ? last.sha.substring(0, 7) : null,
      commitMessage: last.commit?.message ?? null,
      commitUrl: last.commit?.url ?? null
    }
  };
}
