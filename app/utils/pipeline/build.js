/**
 * Check if the build has a warning in the metadata
 * @param build {Object} Build object in the format returned by the API
 * @returns {boolean} true if the build has a warning
 */

export const hasWarning = build => {
  if (build) {
    const warning = build?.meta?.build?.warning || undefined;

    if (typeof warning === 'string') {
      return warning.length > 0;
    }
  }

  return false;
};

/**
 * Set the build status to WARNING if it has a warning and the original status was SUCCESS.
 * The WARNING status is an inferred status only used in the UI
 * @param build
 */
export const setBuildStatus = build => {
  if (hasWarning(build) && build.status === 'SUCCESS') {
    build.status = 'WARNING';
  }
};
