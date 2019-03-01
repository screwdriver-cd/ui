/**
 * Check if the current build is active based on build status
 * @param  {String}  status  Build status
 * @param  {String}  endTime Build end time
 * @return {Boolean} true if build is active.
 */
const isActiveBuild = (status, endTime) => status === 'QUEUED' || status === 'RUNNING'
    || status === 'BLOCKED' || (status === 'UNSTABLE' && !endTime);

/**
 * Check if the current job is a PR job
 * @param  {String}  job name
 * @return {Boolean} true if PR job
 */
const isPRJob = jobName => /^PR-/.test(jobName);

const statusIcon = (status, isLight) => {
  let icon;

  switch (status) {
  case 'QUEUED':
  case 'RUNNING':
    icon = 'spinner fa-spin';
    break;
  case 'CREATED':
  case 'SUCCESS':
    icon = `check-circle${isLight ? '-o' : ''}`;
    break;
  case 'UNSTABLE':
    icon = 'exclamation-circle';
    break;
  case 'FROZEN':
    icon = 'fa-snowflake-o';
    break;
  case 'BLOCKED':
  case 'COLLAPSED':
    icon = 'fa-ban fa-flip-horizontal';
    break;
  case 'FAILURE':
  case 'ABORTED':
    icon = `times-circle${isLight ? '-o' : ''}`;
    break;
  default:
    icon = 'circle-o';
    break;
  }

  return icon;
};

export { isActiveBuild, isPRJob, statusIcon };
