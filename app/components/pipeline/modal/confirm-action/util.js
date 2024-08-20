/**
 * Truncate commit message to 150 characters
 * @param commitMessage
 * @returns {string|*}
 */
export function truncateMessage(commitMessage) {
  const cutOff = 150;

  return commitMessage.length > cutOff
    ? `${commitMessage.substring(0, cutOff)}...`
    : commitMessage;
}

/**
 * Capitalize first letter of string
 * @param string
 * @returns {string}
 */
export function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
