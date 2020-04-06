import { helper } from '@ember/component/helper';

/**
 * Encode name of branch in url for number sign
 * @method branchUrlEncode
 * @param  {Array}     url      url
 * @return {String}             encoded url
 */
export function branchUrlEncode([url]) {
  if (!url) {
    return url;
  }

  return url.replace(/#/g, '%23');
}

export default helper(branchUrlEncode);
