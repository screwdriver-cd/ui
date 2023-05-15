/* eslint-disable */
import { isBlank } from '@ember/utils';

// URL regex courtesy of https://github.com/kevva/url-regex
function urlRegex() {
  return /(["'])?(?:(?:(?:(?:https?|ftp|\w):)?\/\/)|(?:www.))(?:\S+(?::\S*)?@)?(?:(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:1\d\d|2[0-4]\d|25[0-4]|[1-9]\d?))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/#]\S*)?\1/gi;
}

// Shortens the URL and adds three dots to the end
function shortenUrl(url, length) {
  if (!isBlank(url) && url.length > length) {
    url = url.substr(0, length) + '...';
  }

  return url;
}

function isValidHttpOrHttpsUrl(url) {
  try {
    const newUrl = new URL(url);
    return ['http:', 'https:'].includes(newUrl.protocol);
  } catch (err) {
    return false;
  }
}


function isValidRelativePath(path) {
  return String(path).match(/^(\/[^/]+)+$/);
}

function getPipelineBuildUrl() {
  const BUILD_URL_REGEX = /^.+\/pipelines\/\d+\/builds\/\d+/;
  const buildUrlMatch = window.location.href.match(BUILD_URL_REGEX);

  return buildUrlMatch;
}

export { urlRegex, shortenUrl, isValidHttpOrHttpsUrl, isValidRelativePath, getPipelineBuildUrl };
