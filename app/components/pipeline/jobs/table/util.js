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
 * Comparator function that sorts jobs by the build status first, then stage name, and finally job name.
 */
export function sortJobs(a, b) {
  const statusA = a.build?.status;
  const statusB = b.build?.status;

  if (statusA === statusB) {
    const aStageName = a.job.stageName;
    const bStageName = b.job.stageName;

    if (aStageName === bStageName) {
      return a.job.name.localeCompare(b.job.name);
    }

    if (aStageName && bStageName) {
      return aStageName.localeCompare(bStageName);
    }

    return aStageName ? -1 : 1;
  }

  const statusOrder = new Map();

  statusOrder.set('FAILURE', 1);
  statusOrder.set('ABORTED', 1);
  statusOrder.set('WARNING', 2);
  statusOrder.set('UNSTABLE', 2);
  statusOrder.set('RUNNING', 3);
  statusOrder.set('CREATED', 3);
  statusOrder.set('QUEUED', 3);
  statusOrder.set('BLOCKED', 3);
  statusOrder.set('SUCCESS', 4);
  statusOrder.set('COLLAPSED', 5);
  statusOrder.set('FROZEN', 5);
  statusOrder.set(undefined, 6);

  return statusOrder.get(statusA) - statusOrder.get(statusB);
}
