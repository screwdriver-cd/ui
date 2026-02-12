/**
 * Check if the current build is active based on build status
 * @param  {String}  status  Build status
 * @param  {String}  endTime Build end time
 * @return {Boolean} true if build is active.
 */
const isActiveBuild = (status, endTime) =>
  status === 'QUEUED' ||
  status === 'RUNNING' ||
  status === 'BLOCKED' ||
  (status === 'UNSTABLE' && !endTime);

/**
 * Check if the current job is a PR job
 * @param  {String}  job name
 * @return {Boolean} true if PR job
 */
const isPRJob = jobName => /^PR-/.test(jobName);

const statusIcon = (status, isLight, isVirtualJob) => {
  let icon = {
    prefix: 'fa',
    spin: false,
    flip: false
  };

  switch (status) {
    case 'QUEUED':
    case 'RUNNING':
      icon.name = 'spinner';
      icon.spin = true;
      break;
    case 'CREATED':
    case 'WARNING':
    case 'SUCCESS':
      icon.name = isVirtualJob ? 'forward-fast' : 'circle-check';
      icon.prefix = isLight ? 'far' : 'fas';
      break;
    case 'UNSTABLE':
      icon.name = 'circle-exclamation';
      break;
    case 'FROZEN':
      icon.name = 'snowflake';
      icon.prefix = 'fas';
      break;
    case 'BLOCKED':
    case 'COLLAPSED':
      icon.name = 'ban';
      icon.flip = true;
      break;
    case 'FAILURE':
      icon.name = isVirtualJob ? 'forward-fast' : 'circle-xmark';
      icon.prefix = isLight ? 'far' : 'fas';
      break;
    case 'ABORTED':
      icon.name = 'circle-stop';
      icon.prefix = isLight ? 'far' : 'fas';
      break;
    case 'SKIPPED':
      // TODO: Replace skipped property if necessary.
      icon.name = 'circle-exclamation';
      break;
    default:
      icon.name = 'circle';
      icon.prefix = 'far';
      break;
  }

  return icon;
};

/**
 * Return active step name
 * @param  {Array}  build steps
 * @return {String} active step name
 */
const getActiveStep = (steps = []) => {
  const runningStep = steps.find(s => s.startTime && !s.endTime);

  let name;

  if (runningStep && runningStep.name) {
    // eslint-disable-next-line prefer-destructuring
    name = runningStep.name;
  } else {
    const failedStep = steps.find(s => s.code);

    if (failedStep && failedStep.name) {
      // eslint-disable-next-line prefer-destructuring
      name = failedStep.name;
    }
  }

  return name;
};

const unfinishedStatuses = [
  'CREATED',
  'RUNNING',
  'QUEUED',
  'BLOCKED',
  'FROZEN'
];
const stoppableStatuses = ['RUNNING', 'QUEUED', 'BLOCKED', 'FROZEN'];
const statuses = [
  'ABORTED',
  'CREATED',
  'FAILURE',
  'QUEUED',
  'RUNNING',
  'SUCCESS',
  'BLOCKED',
  'UNSTABLE',
  'COLLAPSED',
  'FROZEN'
];

export {
  isActiveBuild,
  isPRJob,
  statusIcon,
  getActiveStep,
  unfinishedStatuses,
  stoppableStatuses,
  statuses
};
