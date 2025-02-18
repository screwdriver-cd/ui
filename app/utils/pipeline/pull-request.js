/**
 * Get the PR number from the job
 * @param job {Object} Job in the shape returned by the API
 * @returns {number|null}
 */
export const getPrNumber = job => {
  return parseInt(job.name.slice('PR-'.length), 10);
};

/**
 * Get the set of PR numbers from the jobs
 * @param jobs {Object} Job in the shape returned by the API
 * @returns {Set<number>}
 */
export const getPrNumbers = jobs => {
  const prNumbers = new Set();

  jobs.forEach(job => {
    prNumbers.add(getPrNumber(job));
  });

  return prNumbers;
};

/**
 * Get the newest PR number from the set of PR numbers
 * @param prNumbers {Set<number>} Set of PR numbers
 * @returns {number}
 */
export const newestPrNumber = prNumbers => {
  return prNumbers.size ? Math.max(...prNumbers) : null;
};

/**
 * Get the oldest PR number from the set of PR numbers
 * @param prNumbers {Set<number>} Set of PR numbers
 * @returns {number}
 */
export const oldestPrNumber = prNumbers => {
  return prNumbers.size ? Math.min(...prNumbers) : null;
};

/**
 * Transforms an array of PR jobs into a map of PR number to jobs
 * @param jobs {Array<Object>} Jobs array with job objects in the shape returned by the API
 * @returns {Map<number, Array<Object>>}
 */
export const getPrJobsMap = jobs => {
  const prJobsMap = new Map();

  jobs.forEach(job => {
    const prNumber = getPrNumber(job);

    if (!prJobsMap.has(prNumber)) {
      prJobsMap.set(prNumber, []);
    }

    prJobsMap.get(prNumber).push(job);
  });

  return prJobsMap;
};
