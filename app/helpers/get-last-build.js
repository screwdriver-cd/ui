import Ember from 'ember';

/**
 * Get first build from an array of builds.
 * @method getLastBuild
 * @param  {Array}     params        An array of arguments
 * @return {Object}    last build
 */
export function getLastBuild(params) {
  const builds = params[0];

  if (builds.length < 1) {
    return '';
  }

  return builds.objectAt(0);
}

export default Ember.Helper.helper(getLastBuild);
