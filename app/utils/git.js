/**
 * Parse a git or https checkout url and get info about the repo
 * @method git
 * @param  {String}  scmUrl Url to parse
 * @return {Object}         Data about the url
 */
function parse(scmUrl) {
  // eslint-disable-next-line max-len
  const match = scmUrl.match(/^(?:(?:https?|git):\/\/)?(?:[^@]+@)?([^/:]+)(?:\/|:)([^/]+)\/([^.#]+)(?:\.git)?(#.+)?$/);

  if (!match) {
    return {
      valid: false
    };
  }

  const result = {
    server: match[1],
    owner: match[2],
    repo: match[3],
    branch: match[4] ? match[4].slice(1) : 'master',
    valid: true
  };

  return result;
}

/**
 * Generate the checkout URL based on pipeline values
 * @method getCheckoutUrl
 * @param  {Object}       config
 * @param  {String}       config.appId    App ID in the form of <organization>/<repo>
 * @param  {String}       config.scmUri   Scm URI with <server>:<URI>:<branch>
 * @return {String}                       Returns the checkout URL
 */
function getCheckoutUrl(config) {
  const scmUri = (config.scmUri).split(':');
  const checkoutUrl = `git@${scmUri[0]}:${config.appId}.git#${scmUri[2]}`;

  return checkoutUrl;
}

export {
  parse,
  getCheckoutUrl
};
