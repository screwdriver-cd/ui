import { helper } from '@ember/component/helper';

/**
 * Truncates a given text to a specified maximum length and appends an ellipsis ('...') if the text exceeds that length.
 * @method truncate
 * @param  {Array} params Array containing the text to truncate as the first element, and the maximum length as the second element.
 * @return {String} The truncated text with an ellipsis if the length of the text exceeds the maximum length, or the original text if it does not.
 */
export function truncate([text, maxLength, hideEllipsis]) {
  const ellipsis = '...';

  if (!text || text.length <= maxLength) {
    return text;
  }

  if (hideEllipsis) {
    return `${text.substring(0, maxLength)}`;
  }

  return `${text.substring(0, maxLength)}${ellipsis}`;
}

export default helper(truncate);
