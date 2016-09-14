/**
 * Parse a git url and get info about the repo
 * @method git
 * @param  {String}  scmUrl Url to parse
 * @return {Object}         Data about the url
 */
export default {
  parse(scmUrl) {
    const match = scmUrl.match(/^git@([^:]+):([^/]+)\/([^/]+)\.git(#(.+))?/);

    if (!match) {
      return {
        valid: false
      };
    }

    const result = {
      server: match[1],
      owner: match[2],
      repo: match[3],
      branch: match[5] || 'master',
      link: `https://${match[1]}/${match[2]}/${match[3]}`,
      valid: true
    };

    if (result.branch !== 'master') {
      result.link += `/tree/${result.branch}`;
    }

    return result;
  }
};
