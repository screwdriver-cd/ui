/**
 * Get the stage name of the job.
 * @param job {Object} Job in the format returned by the API
 * @returns {string}
 */
export default function getStageName(job) {
  return job?.permutations?.[0]?.stage?.name || 'N/A';
}
