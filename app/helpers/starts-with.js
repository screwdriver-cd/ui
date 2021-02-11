import { helper } from '@ember/component/helper';

/**
 * return whether string starts with given string
 * @param  {[String]}  str           Any string
 * @param  {[String]}  searchString  Any string
 * @return {Boolean}
 */
export function startsWith([str = '', searchString] /* , hash */) {
  return str.startsWith(searchString);
}

export default helper(startsWith);
