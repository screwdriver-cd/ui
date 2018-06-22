/**
 * Check if the current build is active based on build status
 * @param  {String}  status Build status
 * @return {Boolean} true if build is active.
 */
const isActiveBuild = status => status === 'QUEUED' || status === 'RUNNING' || status === 'BLOCKED';

/**
 * Check if the current job is a PR job
 * @param  {String}  job name
 * @return {Boolean} true if PR job
 */
const isPRJob = jobName => /^PR-/.test(jobName);

export { isActiveBuild, isPRJob };
