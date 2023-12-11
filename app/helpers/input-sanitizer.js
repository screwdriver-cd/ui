import { helper } from '@ember/component/helper';
import { htmlSafe } from '@ember/template';

/**
 * Sanitizes given string
 * @method inputSanitizer
 * @param  {String}  string  String to be sanitized
 * @return {String}          Sanitized string
 */
export function inputSanitizer([string] /* , hash */) {
  if (typeof string !== 'string') {
    return '';
  }

  const escape = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  };

  return htmlSafe(string.replace(/[&<>"'/`=]/g, match => escape[match]));
}

export default helper(inputSanitizer);
