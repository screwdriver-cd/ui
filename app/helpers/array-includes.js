import { helper } from '@ember/component/helper';

/**
 * return whether toFind exists in array or not
 * @method arrayIncludes
 * @param  {String}    toFind  Value Any string
 * @param  {Array}     array   An array of string or a string
 * @return {Boolean}
 */
export function arrayIncludes([toFind, array]) {
  const list = Array.isArray(array) ? array : [array];

  if (list.indexOf(toFind) > -1) {
    return true;
  }

  return false;
}

export default helper(arrayIncludes);
