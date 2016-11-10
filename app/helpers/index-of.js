import Ember from 'ember';

/**
 * get an element of the array at the specified index
 * @method indexOf
 * @param  {Array} params   [contextArr, index]
 * @return {Mixed}
 */
export function indexOf(params) {
  if (Array.isArray(params[0])) {
    return params[0][params[1]];
  }

  return params[0].objectAt(params[1]);
}

export default Ember.Helper.helper(indexOf);
