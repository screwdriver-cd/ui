import { helper } from '@ember/component/helper';

/**
 * return whether inupt is a number or not
 * @param  {[String]}  value  Any string
 * @return {Boolean}
 */
export function isNumber([value] /* , hash */) {
  return !Number.isNaN(Number(value));
}

export default helper(isNumber);
