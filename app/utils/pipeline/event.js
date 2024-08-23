import { unfinishedStatuses } from 'screwdriver-ui/utils/build';

/**
 * Determines if the event has been skipped
 * @param event
 * @param builds
 * @returns {boolean}
 */
export const isSkipped = (event, builds) => {
  if (event.type === 'pr' || !builds || builds.length > 0) {
    return false;
  }

  return !!event?.commit?.message.match(/\[(skip ci|ci skip)\]/);
};

/**
 * Determines if the all builds have completed
 * @param {Array} builds Array of builds in the format returned by the API
 * @returns {boolean} true if all builds have a status that indicates they have completed
 */
export const isComplete = builds => {
  if (!builds || builds.length === 0) {
    return true;
  }

  return builds.every(build => {
    const { status } = build;

    if (status === 'UNSTABLE') {
      return build.endTime !== undefined;
    }

    return !unfinishedStatuses.includes(status);
  });
};
