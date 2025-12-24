import { unfinishedStatuses } from 'screwdriver-ui/utils/build';

/**
 * Determines if the event has been skipped
 * @param {Object} event Event object in the format returned by the API
 * @param {Array} builds Array of builds in the format returned by the API
 * @returns {boolean} true if the event has been skipped
 */
export const isSkipped = (event, builds) => {
  if (event.type === 'pr') {
    return false;
  }

  return builds?.length > 0
    ? false
    : !!event.commit?.message.match(/\[(skip ci|ci skip)\]/);
};

/**
 * Determines if the all builds have completed
 * @param {Array} builds Array of builds in the format returned by the API
 * @param {Array} previousBuilds Array of previous builds in the format returned by the API
 * @returns {boolean} true if all builds have a status that indicates they have completed
 */
export const isComplete = (builds, previousBuilds = []) => {
  const CREATED = 'CREATED';

  // No builds means nothing is completed
  if (!builds || builds.length === 0) {
    return false;
  }

  const nonCreatedBuilds = builds.filter(b => b.status !== CREATED);

  // If all builds are still in CREATED state, treat as not completed
  if (nonCreatedBuilds.length === 0) return false;

  const isFinished = build => {
    if (build.status === 'UNSTABLE') {
      // UNSTABLE is considered finished only when endTime is set
      return build.endTime !== undefined;
    }

    return !unfinishedStatuses.includes(build.status);
  };

  // Initial run: skip CREATED-difference check and
  // consider completed only if at least one non-CREATED build exists
  // and all non-CREATED builds are finished
  if (previousBuilds.length === 0) {
    return nonCreatedBuilds.every(isFinished);
  }

  const currentCreatedBuildIds = new Set(
    builds.filter(build => build.status === CREATED).map(build => build.id)
  );
  const previousCreatedBuildIds = new Set(
    previousBuilds
      .filter(build => build.status === CREATED)
      .map(build => build.id)
  );

  // If new CREATED builds appeared since the previous check,
  // treat the whole set as not completed
  if (currentCreatedBuildIds.difference(previousCreatedBuildIds).size !== 0)
    return false;

  // No new CREATED builds and all non-CREATED builds are finished
  return nonCreatedBuilds.every(isFinished);
};

/**
 * Get the status of the event
 * @param {Array} builds Array of builds in the format returned by the API
 * @param {boolean} isEventSkipped
 * @param {boolean} isEventComplete
 * @returns {*} The status of the event
 */
export const getStatus = (builds, isEventSkipped, isEventComplete) => {
  if (isEventSkipped) {
    return 'SKIPPED';
  }

  if (!builds || builds.length === 0) {
    return 'UNKNOWN';
  }

  if (isEventComplete) {
    const filteredBuilds = builds.filter(build => build.status !== 'CREATED');

    if (filteredBuilds.length === 0) {
      return 'RUNNING';
    }

    return filteredBuilds.filter(build => build.status === 'WARNING').length > 0
      ? 'WARNING'
      : filteredBuilds[0].status;
  }

  return builds[0].status === 'FROZEN' ? 'FROZEN' : 'RUNNING';
};
