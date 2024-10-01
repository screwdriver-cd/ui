import { unfinishedStatuses } from 'screwdriver-ui/utils/build';
import { hasWarning } from './build';

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
    : !!event?.commit?.message.match(/\[(skip ci|ci skip)\]/);
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

/**
 * Get the status of the event
 * @param {Object} event Event object in the format returned by the API
 * @param {Array} builds Array of builds in the format returned by the API
 * @returns {*} The status of the event
 */
export const getStatus = (event, builds) => {
  if (isSkipped(event, builds)) {
    return 'SKIPPED';
  }

  if (isComplete(builds)) {
    if (!builds || builds.length === 0) {
      return 'UNKNOWN';
    }

    return builds.filter(build => hasWarning(build)).length > 0
      ? 'WARNING'
      : builds[0].status;
  }

  return builds[0].status === 'FROZEN' ? 'FROZEN' : 'RUNNING';
};
