/**
 * Comparator function that sorts jobs by the build status first, then stage name, and finally job name.
 * When sorting by build status, the ordering is ordered by the status color: red, yellow, blue, green, grey, no-status (i.e., jobs that did not run).
 */
export default function sortJobs(a, b) {
  const statusA = a.build?.status;
  const statusB = b.build?.status;

  if (statusA === statusB) {
    const aStageName = a.stageName;
    const bStageName = b.stageName;

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
