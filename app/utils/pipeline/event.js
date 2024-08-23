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

/**
 * Determines if the event has builds that still need to complete
 * @param builds
 * @returns {boolean}
 */
export const hasBuildsToComplete = builds => {
  if (!builds || builds.length === 0) {
    return false;
  }

  const buildsToComplete = builds.find(build => {
    const { status, endTime } = build;

    switch (status) {
      case 'CREATED':
      case 'QUEUED':
      case 'RUNNING':
      case 'BLOCKED':
        return true;
      case 'UNSTABLE':
        return endTime === undefined;
      default:
        return false;
    }
  });

  return buildsToComplete !== undefined;
};

/**
 * Determines if the all builds have completed
 * @param builds
 * @returns {boolean}
 */
export const areAllBuildsComplete = builds => {
  if (!builds || builds.length === 0) {
    return true;
  }

  return builds.every(build => {
    const { status } = build;

    if (status === 'UNSTABLE') {
      return build.endTime !== undefined;
    }

    return ['SUCCESS', 'FAILURE', 'ABORTED'].includes(status);
  });
};
