/**
 * Determines if the event has been skipped
 * @param event
 * @param builds
 * @returns {boolean}
 */
// eslint-disable-next-line import/prefer-default-export
export const isSkipped = (event, builds) => {
  if (event.type === 'pr' || builds.length > 0) {
    return false;
  }

  return !!event.commit.message.match(/\[(skip ci|ci skip)\]/);
};
