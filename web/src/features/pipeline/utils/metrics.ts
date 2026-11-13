/**
 * Pure data transforms for the pipeline Metrics page.
 * Ports of app/pipeline/metrics/{route,controller}.js and app/utils/time-range.js.
 */
import type { Metric } from '../types';

/** Ember's time range presets (`timeRanges` in the metrics controller). */
export const RANGE_PRESETS = ['6hr', '12hr', '1d', '1wk', '1mo', '3mo', '180d'] as const;
export type RangePreset = (typeof RANGE_PRESETS)[number];
export const DEFAULT_RANGE: RangePreset = '1wk';

export interface TimeWindow {
  startTime: string;
  endTime: string;
}

/** ISO 8601 up to the minute, e.g. 2024-03-14T09:30 (Ember iso8601UpToMinute). */
export function isoUpToMinute(date: Date): string {
  const d = date.toISOString();

  return d.substring(0, d.lastIndexOf(':'));
}

/** Start/end of a preset range ending at `end` (Ember utils/time-range). */
export function timeRange(range: string, end = new Date()): TimeWindow | null {
  const match = /^(\d+)(hr|d|wk|mo|yr)$/.exec(range);

  if (!match) {
    return null;
  }

  const quantity = Number(match[1]);
  const current = new Date(end);
  const endTime = isoUpToMinute(current);

  switch (match[2]) {
    case 'hr':
      current.setUTCHours(current.getUTCHours() - quantity);
      break;
    case 'd':
      current.setUTCDate(current.getUTCDate() - quantity);
      break;
    case 'wk':
      current.setUTCDate(current.getUTCDate() - quantity * 7);
      break;
    case 'mo':
      current.setUTCMonth(current.getUTCMonth() - quantity);
      break;
    default:
      current.setUTCFullYear(current.getUTCFullYear() - quantity);
  }

  return { startTime: isoUpToMinute(current), endTime };
}

/** `yyyy-mm-dd` in local time, the value format of `<input type="date">`. */
export function toDateInput(iso: string): string {
  const d = new Date(iso);

  if (Number.isNaN(d.getTime())) {
    return '';
  }

  const pad = (n: number) => String(n).padStart(2, '0');

  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * A custom date range from two `yyyy-mm-dd` inputs: local midnight of the start
 * day to 23:59:59 local of the end day (Ember setCustomRange). Null if invalid.
 */
export function customRange(start: string, end: string): TimeWindow | null {
  const parse = (value: string) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

    return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
  };
  const s = parse(start);
  const e = parse(end);

  if (!s || !e || e < s) {
    return null;
  }

  e.setHours(23, 59, 59, 0);

  return { startTime: s.toISOString(), endTime: e.toISOString() };
}

const toMinutes = (seconds: number | null | undefined) =>
  typeof seconds === 'number' && Number.isFinite(seconds) ? seconds / 60 : 0;

/** A metric as the API returns it for one job's builds (with steps). */
export interface JobMetric extends Metric {
  steps?: Array<{ name?: string; duration?: number | null }>;
}

/** A metric from the downtime query (`downtimeJobs[]`/`downtimeStatuses[]`). */
export interface DowntimeMetric extends Metric {
  isDowntimeEvent?: boolean;
  downtimeDuration?: number;
}

/** Ember's `downtimeStatuses` for the Downtime vs Build Count chart. */
export const DOWNTIME_STATUSES = ['FAILURE'];

/** One x position on a chart: an event (or a build for step breakdown). */
export interface ChartRow {
  /** Event id (or build id for the step chart). */
  id: number;
  time: string;
  sha: string;
  status: string;
  /** Series key -> minutes. */
  values: Record<string, number>;
  /** Series key -> build id, for charts whose segments are builds. */
  buildIds?: Record<string, number>;
}

/** Oldest first, the order the charts draw in. */
const byTime = <T extends Metric>(metrics: T[]) =>
  [...metrics].sort(
    (a, b) => new Date(a.createTime).getTime() - new Date(b.createTime).getTime() || a.id - b.id
  );

const keep = (successOnly: boolean) => (m: Metric) => !successOnly || m.status === 'SUCCESS';

export const EVENT_SERIES = ['queuedTime', 'imagePullTime', 'duration'] as const;

/** Events chart: queued, image pull and duration per event, plus their total for the trendline. */
export function eventRows(metrics: Metric[], successOnly = false): ChartRow[] {
  return byTime(metrics)
    .filter(keep(successOnly))
    .map(m => ({
      id: m.id,
      time: m.createTime,
      sha: m.sha ?? '',
      status: m.status,
      values: {
        queuedTime: toMinutes(m.queuedTime),
        imagePullTime: toMinutes(m.imagePullTime),
        duration: toMinutes(m.duration),
        total: toMinutes(m.queuedTime + m.imagePullTime + m.duration)
      }
    }));
}

export interface JobSeries {
  key: string;
  jobId: number;
  name: string;
}

/**
 * Build Breakdown Per Event: one stacked segment per job, keyed by job id.
 * Jobs are those that ran in the window and still belong to the pipeline
 * (Ember's jobMap), ordered by job id.
 */
export function buildBreakdown(
  metrics: Metric[],
  jobNames: Map<number, string>,
  successOnly = false
): { rows: ChartRow[]; jobs: JobSeries[] } {
  const seen = new Map<number, string>();
  const rows = byTime(metrics)
    .filter(keep(successOnly))
    .map(m => {
      const values: Record<string, number> = {};
      const buildIds: Record<string, number> = {};

      for (const b of m.builds ?? []) {
        const name = jobNames.get(b.jobId);

        if (name !== undefined) {
          seen.set(b.jobId, name);
          values[String(b.jobId)] = toMinutes(b.duration);
          buildIds[String(b.jobId)] = b.id;
        }
      }

      return { id: m.id, time: m.createTime, sha: m.sha ?? '', status: m.status, values, buildIds };
    });
  const jobs = [...seen.entries()]
    .sort(([a], [b]) => a - b)
    .map(([jobId, name]) => ({ key: String(jobId), jobId, name }));

  return { rows, jobs };
}

/** Step Breakdown Per Build: one stacked segment per step, steps sorted by name. */
export function stepBreakdown(
  metrics: JobMetric[],
  successOnly = false
): { rows: ChartRow[]; steps: string[] } {
  const names = new Set<string>();
  const rows = byTime(metrics)
    .filter(keep(successOnly))
    .map(m => {
      const values: Record<string, number> = {};

      for (const s of m.steps ?? []) {
        if (s.name) {
          names.add(s.name);
          values[s.name] = toMinutes(s.duration);
        }
      }

      return { id: m.id, time: m.createTime, sha: m.sha ?? '', status: m.status, values };
    });

  return { rows, steps: [...names].sort() };
}

/**
 * Downtime vs Build Count: minutes of downtime for downtime events (0
 * otherwise) and the number of builds per event.
 */
export function downtimeRows(metrics: DowntimeMetric[]): ChartRow[] {
  return byTime(metrics).map(m => ({
    id: m.id,
    time: m.createTime,
    sha: m.sha ?? '',
    status: m.status,
    values: {
      downtime: m.isDowntimeEvent ? toMinutes(m.downtimeDuration) : 0,
      builds: m.builds?.length ?? 0
    }
  }));
}

export interface MetricsSummary {
  total: number;
  passed: number;
  failed: number;
  successRate: number;
  /** Seconds, averaged over the events the charts show. */
  avgDuration: number;
  avgQueued: number;
  avgImagePull: number;
}

/**
 * Header measures. Total and passed/failed count every event in the window
 * (as Ember does); averages cover the events shown, so "Success Only"
 * averages successful events only.
 */
export function summarize(metrics: Metric[], successOnly = false): MetricsSummary {
  const shown = metrics.filter(keep(successOnly));
  const avg = (pick: (m: Metric) => number) =>
    shown.length ? shown.reduce((sum, m) => sum + pick(m), 0) / shown.length : 0;
  const passed = metrics.filter(m => m.status === 'SUCCESS').length;

  return {
    total: metrics.length,
    passed,
    failed: metrics.length - passed,
    successRate: metrics.length ? passed / metrics.length : 0,
    avgDuration: avg(m => m.duration),
    avgQueued: avg(m => m.queuedTime),
    avgImagePull: avg(m => m.imagePullTime)
  };
}

/** Validated categorical order (dataviz reference palette); a 9th+ series is "other" gray. */
export const CATEGORICAL = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948'];
export const OTHER_COLOR = '#898781';

/** Color by the entity's stable position, never by what is currently visible. */
export const categoricalColor = (index: number) => CATEGORICAL[index] ?? OTHER_COLOR;

/** Clamp a zoom window to the row count; null means "everything". */
export function clampZoom(zoom: [number, number] | null, length: number): [number, number] {
  if (!zoom || length === 0) {
    return [0, Math.max(length - 1, 0)];
  }

  const lo = Math.max(0, Math.min(zoom[0], zoom[1]));
  const hi = Math.min(length - 1, Math.max(zoom[0], zoom[1]));

  return lo > hi ? [0, length - 1] : [lo, hi];
}

/** Which row indexes get an x tick label so labels never overlap. */
export function tickIndexes(count: number, width: number, labelWidth = 96): number[] {
  if (count <= 0) {
    return [];
  }

  const max = Math.max(1, Math.floor(width / labelWidth));
  const step = Math.max(1, Math.ceil(count / max));
  const out: number[] = [];

  for (let i = 0; i < count; i += step) {
    out.push(i);
  }

  return out;
}

/** "Nice" y-axis maximum and ticks for values in minutes (or counts). */
export function niceTicks(max: number, count = 4): number[] {
  if (!(max > 0)) {
    return [0, 1];
  }

  const raw = max / count;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map(f => f * magnitude).find(s => s >= raw) ?? raw;
  const ticks: number[] = [];

  for (let v = 0; v < max + step * 0.999; v += step) {
    ticks.push(Number(v.toFixed(6)));
  }

  return ticks;
}

/** The stacked segment (series key) at `value` minutes up a column, bottom first. */
export function segmentAt(
  values: Record<string, number>,
  order: string[],
  value: number
): string | null {
  let acc = 0;

  for (const key of order) {
    const v = values[key] ?? 0;

    if (v > 0 && value >= acc && value <= acc + v) {
      return key;
    }
    acc += v;
  }

  return null;
}
