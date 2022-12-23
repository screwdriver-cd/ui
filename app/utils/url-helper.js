const URL_REGEX = /(((https?:\/\/)|(www\.))[^\s]+)/g;

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

  // eslint-disable-next-line consistent-return
  return text.replace(URL_REGEX, function transformUrl(url) {
    let hyperlink = url;

    // eslint-disable-next-line no-useless-escape
    if (!hyperlink.match('^https?:\/\/')) {
      // eslint-disable-next-line prefer-template
      hyperlink = 'http://' + hyperlink;
    }

    return (
      // eslint-disable-next-line prefer-template
      '<a href="' +
      hyperlink +
      '" target="_blank" rel="noopener noreferrer">' +
      url +
      '</a>'
    );
  });
}
