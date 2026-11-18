/*!
 * @license MIT
 * URL regex adapted from https://github.com/kevva/url-regex
 * License source: https://github.com/kevva/url-regex/blob/master/license
 * The following license applies to the url-regex-derived implementation of urlRegex.
 *
 * The MIT License (MIT)
 *
 * Copyright (c) Kevin Mårtensson <kevinmartensson@gmail.com> and Diego Perini
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

/* eslint-disable */
import { isBlank } from '@ember/utils';

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
