/**
 * Parse a git or https checkout url and get info about the repo
 * @method git
 * @param  {String}  scmUrl Url to parse
 * @return {Object}         Data about the url
 */
export default {
  parse(scmUrl) {
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
};
