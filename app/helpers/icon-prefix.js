import { helper } from '@ember/component/helper';

const faIcons = ['spinner', 'check', 'times', 'ban'];

/**
 * Gets the icon prefix pack
 * @method getIconPrefix
 * @param  {String}    icon   icon name
 * @return {String}
 */
export function getIconPrefix([icon]) {
  if (faIcons.includes(icon)) return 'fa';

  return 'far';
}

export default helper(getIconPrefix);
