/**
 * Determines if the event has been skipped
 * @param event
 * @param builds
 * @returns {boolean}
 */
export const isSkipped = (event, builds) => {
  if (event.type === 'pr' || builds.length > 0) {
    return false;
  }

  return !!event.commit.message.match(/\[(skip ci|ci skip)\]/);
};

/**
 * Determines if the event has been aborted
 * @param builds
 * @returns {boolean}
 */
export const isAborted = builds => {
  if (builds && builds.length > 0) {
    return builds[0].status === 'ABORTED';
  }

  return false;
};
