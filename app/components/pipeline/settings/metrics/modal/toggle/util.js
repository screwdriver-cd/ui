/**
 * Utility function to get job ids for payload based on the pipeline and jobs provided.
 * @param pipeline Pipeline object returned from the API
 * @param jobs Array of job objects
 * @param isInclude Boolean indicating whether to include or exclude jobs
 * @return {Array} Array of job ids
 */
export default function getJobIdsForPayload(pipeline, jobs, isInclude) {
  const includedJobs = pipeline.settings.metricsDowntimeJobs || [];
  const jobIdsPayload = [];

  if (isInclude) {
    const jobIdsToInclude = new Set(includedJobs);

    jobs.forEach(job => {
      jobIdsToInclude.add(job.id);
    });

    jobIdsPayload.push(...Array.from(jobIdsToInclude));
  } else {
    const jobIdsToExclude = new Set(includedJobs);

    jobs.forEach(job => {
      jobIdsToExclude.delete(job.id);
    });

    jobIdsPayload.push(...Array.from(jobIdsToExclude));
  }

  return jobIdsPayload.sort();
}
