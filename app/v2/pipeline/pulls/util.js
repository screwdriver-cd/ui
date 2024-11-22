/**
 * Get the PR number from the job
 * @param job {Object} Job in the shape returned by the API
 * @returns {number|null}
 */
export const getPrNumber = job => {
  return parseInt(job.name.slice('PR-'.length), 10);
};

/**
 * Get the newest PR number from the set of PR numbers
 * @param prNumbers {Set<number>} Set of PR numbers
 * @returns {number}
 */
export const newestPrNumber = prNumbers => {
  return prNumbers.size ? Math.max(...prNumbers) : null;
};
