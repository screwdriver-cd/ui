/**
 * Get the display name of the job.  Uses the display name configured in the annotation if available.
 * @param job {Object} Job in the format returned by the API
 * @param prNum {Number} PR number
 * @returns {string}
 */
export function getDisplayName(job, prNum) {
  const jobName = prNum ? job.name.slice(`PR-${prNum}:`.length) : job.name;
  const { annotations } = job?.permutations?.[0] || {};

  if (annotations) {
    return annotations['screwdriver.cd/displayName'] || jobName;
  }

  return jobName;
}

/**
 * Get the stage name of the job.
 * @param job {Object} Job in the format returned by the API
 * @returns {string}
 */
export function getStageName(job) {
  return job?.permutations?.[0]?.stage?.name;
}
