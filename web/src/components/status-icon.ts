import type { IconName } from './Icon';

export interface StatusIconSpec {
  name: IconName;
  spin?: boolean;
  flip?: 'horizontal';
}

/** Same mapping as the Ember UI's `statusIcon()` (app/utils/build.js); `light` is the outlined variant the event cards use. */
export function statusIconSpec(status: string | undefined, { light = true, virtual = false } = {}): StatusIconSpec {
  switch (status) {
    case 'QUEUED':
    case 'RUNNING':
      return { name: 'spinner', spin: true };
    case 'CREATED':
    case 'WARNING':
    case 'SUCCESS':
      return { name: virtual ? 'forwardFast' : light ? 'circleCheck' : 'circleCheckSolid' };
    case 'UNSTABLE':
    case 'SKIPPED':
      return { name: 'circleExclamation' };
    case 'FROZEN':
      return { name: 'snowflake' };
    case 'BLOCKED':
    case 'COLLAPSED':
      return { name: 'ban', flip: 'horizontal' };
    case 'FAILURE':
      return { name: virtual ? 'forwardFast' : light ? 'circleXmark' : 'circleXmarkSolid' };
    case 'ABORTED':
      return { name: light ? 'circleStop' : 'circleStopSolid' };
    default:
      return { name: 'circle' };
  }
}
