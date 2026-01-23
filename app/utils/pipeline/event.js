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
 * @param {Set} virtualJobIds A set of virtual job IDs
 * @returns {boolean} true if all builds have a status that indicates they have completed
 */
export const isComplete = (
  builds,
  previousBuilds,
  virtualJobIds = new Set()
) => {
  const CREATED = 'CREATED';

  if (!builds || builds.length === 0) {
    return false;
  }

  const currentCreatedBuildIds = new Set(
    builds
      .filter(build => {
        if (virtualJobIds.has(build.jobId)) {
          return false;
        }

        return build.status === CREATED;
      })
      .map(build => build.id)
  );
  const previousCreatedBuildIds = new Set(
    previousBuilds
      .filter(build => {
        if (virtualJobIds.has(build.jobId)) {
          return false;
        }

        return build.status === CREATED;
      })
      .map(build => build.id)
  );

  if (currentCreatedBuildIds.difference(previousCreatedBuildIds).size === 0) {
    return builds
      .filter(build => build.status !== CREATED)
      .every(build => {
        const { status } = build;

        if (status === 'UNSTABLE') {
          return build.endTime !== undefined;
        }

        return !unfinishedStatuses.includes(status);
      });
  }

  return false;
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
