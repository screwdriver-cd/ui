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

export { isActiveBuild, isPRJob };
