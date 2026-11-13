import type { Build, SdEvent } from '../types';

export const UNFINISHED_STATUSES = [
  'CREATED',
  'RUNNING',
  'QUEUED',
  'BLOCKED',
  'FROZEN'
];
const CREATED = 'CREATED';

/** True when the commit asked CI to skip and no build was ever created. */
export function isSkipped(
  event: Pick<SdEvent, 'type' | 'commit'>,
  builds?: Build[]
): boolean {
  if (event.type === 'pr') {
    return false;
  }

  return builds && builds.length > 0
    ? false
    : /\[(skip ci|ci skip)\]/.test(event.commit?.message ?? '');
}

const createdIds = (builds: Build[], virtualJobIds: Set<number>) =>
  new Set(
    builds
      .filter(b => !virtualJobIds.has(b.jobId) && b.status === CREATED)
      .map(b => b.id)
  );

/**
 * True when every build has finished and no new CREATED builds appeared since
 * the previous snapshot (a CREATED build means a downstream job is still pending).
 */
export function isComplete(
  builds: Build[] | undefined,
  previousBuilds: Build[] = [],
  virtualJobIds: Set<number> = new Set()
): boolean {
  if (!builds || builds.length === 0) {
    return false;
  }

  const current = createdIds(builds, virtualJobIds);
  const previous = createdIds(previousBuilds, virtualJobIds);

  for (const id of current) {
    if (!previous.has(id)) {
      return false;
    }
  }

  return builds
    .filter(b => b.status !== CREATED)
    .every(b =>
      b.status === 'UNSTABLE'
        ? b.endTime !== undefined
        : !UNFINISHED_STATUSES.includes(b.status)
    );
}

export function getStatus(
  builds: Build[] | undefined,
  skipped: boolean,
  complete: boolean
): string {
  if (skipped) {
    return 'SKIPPED';
  }
  if (!builds || builds.length === 0) {
    return 'UNKNOWN';
  }
  if (complete) {
    const finished = builds.filter(b => b.status !== CREATED);

    if (finished.length === 0) {
      return 'RUNNING';
    }

    return finished.some(b => b.status === 'WARNING')
      ? 'WARNING'
      : (finished[0] as Build).status;
  }

  return (builds[0] as Build).status === 'FROZEN' ? 'FROZEN' : 'RUNNING';
}

/** The "WARNING" status is UI-only: a SUCCESS build whose meta carries a warning. */
export function withWarningStatus(build: Build): Build {
  return build.status === 'SUCCESS' && build.meta?.build?.warning
    ? { ...build, status: 'WARNING' }
    : build;
}

export const getFailureCount = (builds: Build[]) =>
  builds.filter(b => b.status === 'FAILURE' || b.status === 'ABORTED').length;
export const getWarningCount = (builds: Build[]) =>
  builds.filter(b => b.status === 'WARNING' || b.status === 'UNSTABLE').length;
export const getSuccessCount = (builds: Build[]) =>
  builds.filter(b => b.status === 'SUCCESS').length;

export function getFirstCreateTime(builds: Build[]): number | null {
  const times = builds
    .map(b => new Date(b.createTime).getTime())
    .filter(n => !Number.isNaN(n));

  return times.length ? Math.min(...times) : null;
}

/** Wall-clock span of an event: first build created until the last build ended. */
export function getDuration(
  builds: Build[],
  virtualJobIds: Set<number> = new Set()
): number {
  const first = getFirstCreateTime(builds);
  const ends = builds
    .map(b => {
      if (b.endTime) {
        return new Date(b.endTime).getTime();
      }

      return virtualJobIds.has(b.jobId)
        ? new Date(b.createTime).getTime()
        : NaN;
    })
    .filter(n => !Number.isNaN(n));

  if (first === null || ends.length === 0) {
    return 0;
  }

  return Math.max(...ends) - first;
}

const UNITS: Array<[string, number]> = [
  ['y', 365 * 86400],
  ['mo', 30 * 86400],
  ['w', 7 * 86400],
  ['d', 86400],
  ['h', 3600],
  ['m', 60],
  ['s', 1]
];

/** "1h 5m 3s", the compact style the event cards use. */
export function formatShortDuration(ms: number): string {
  let seconds = Math.round(Math.max(ms, 0) / 1000);
  const parts: string[] = [];

  for (const [unit, size] of UNITS) {
    if (seconds >= size) {
      parts.push(`${Math.floor(seconds / size)}${unit}`);
      seconds %= size;
    }
  }

  return parts.length ? parts.join(' ') : '0s';
}

const EXTERNAL = /^~sd@(\d+):([\w-]+)$/;

export function getExternalPipelineId(
  event: Pick<SdEvent, 'startFrom'>
): number | null {
  const match = event.startFrom ? EXTERNAL.exec(event.startFrom) : null;

  return match ? Number(match[1]) : null;
}

export function isExternalTrigger(
  event: Pick<SdEvent, 'startFrom' | 'pipelineId'>
): boolean {
  const id = getExternalPipelineId(event);

  return id !== null && id !== event.pipelineId;
}

export function isCommitterDifferent(event: SdEvent): boolean {
  return (
    isExternalTrigger(event) ||
    event.creator?.name !== event.commit?.author?.name
  );
}

export const truncate = (text: string, length: number) =>
  text.length > length ? `${text.substring(0, length)}...` : text;

export const truncatedSha = (sha: string) => sha.substring(0, 7);

export function eventTitle(
  event: Pick<SdEvent, 'id' | 'groupEventId'>
): string {
  const title = `Event: ${event.id}`;

  return event.id === event.groupEventId
    ? title
    : `${title}\nGroup: ${event.groupEventId}`;
}
