import { helper } from '@ember/component/helper';

/**
 * return whether inupt is an array or not
 * @param  {Any}
 * @return {Boolean}
 */
export function isarray(params) {
  const [value] = params;

  return Array.isArray(value);
}

export default helper(isarray);
