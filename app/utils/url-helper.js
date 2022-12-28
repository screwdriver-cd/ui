const URL_REGEX = /(((https?:\/\/)|(www\.))[^\s]+)/g;
const TAGS_REGEX = /<(.|\n)*>/g;

/**
 * @param {String} text to check if it contains link
 * @return {Boolean}
 */
export function doesTextContainsLink(text) {
  return new RegExp(URL_REGEX).test(text);
}

/**
 * @param {String} text to transform into clickable content
 * @return {String} string with clickable content
 */
export function transformTextToClickableContent(text) {
  if (!text) return;

  const filteredString = text.replace(TAGS_REGEX, '');

  // eslint-disable-next-line consistent-return
  return filteredString.replace(URL_REGEX, function transformUrl(url) {
    let hyperlink = url;

    // eslint-disable-next-line no-useless-escape
    if (!hyperlink.match('^https?://')) {
      hyperlink = `http://${hyperlink}`;
    }

    return `<a href="${hyperlink}" target="_blank" rel="noopener noreferrer">${url}</a>`;
  });
}
