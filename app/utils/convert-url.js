const URL_REGEX = /(((https?:\/\/)|(www\.))[^\s]+)/g;

export function DoesTextContainsLink(text) {
  return new RegExp(URL_REGEX).test(text);
}

export function TransformTextToClickableContent(text) {
  if(!text) return;

  return text.replace(URL_REGEX, function (url) {
    let hyperlink = url;
    if (!hyperlink.match('^https?:\/\/')) {
      hyperlink = 'http://' + hyperlink;
    }
    return (
      '<a href="' + hyperlink + '" target="_blank" rel="noopener noreferrer">' + url + '</a>'
    );
  });
}