import { helper } from '@ember/component/helper';

/**
 * Gets the icon animation status
 * @method getIconSpin
 * @param  {String}    icon   icon name
 * @return {Boolean}
 */
export function getIconSpin([icon]) {
  if (icon === 'spinner') return true;

  return false;
}

export default helper(getIconSpin);
