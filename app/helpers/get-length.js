import { helper } from '@ember/component/helper';

/**
 * getLength helper returns the length of given target
 * @param  {Any}
 * @return {Number}
 */
export function getLength([target] /* , hash */) {
  if (typeof target === 'object') {
    return Object.keys(target).length;
  }

  if (typeof target === 'string' || Array.isArray(target)) {
    return target.length;
  }

  return 0;
}

export default helper(getLength);
