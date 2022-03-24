import { helper } from '@ember/component/helper';
import { typeOf } from '@ember/utils';

/**
 * return whether inupt is a string or not
 * @param  {[String]}  value  Any string
 * @return {Boolean}
 */
export function isObject([value] /* , hash */) {
  return typeOf(value) === 'object';
}

export default helper(isObject);
