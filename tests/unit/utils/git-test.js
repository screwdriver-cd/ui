import git from 'screwdriver-ui/utils/git';
import { module, test } from 'qunit';

module('Unit | Utility | git', function() {
  test('it parses the checkout URL correctly', assert => {
    let result = git.parse('bananas');

    assert.notOk(result.valid);

    result = git.parse('git@github.com:bananas/peel.git');

    assert.deepEqual(result, {
      server: 'github.com',
      owner: 'bananas',
      repo: 'peel',
      branch: null,
      valid: true
    });

    result = git.parse('git@github.com:bananas/peel.git#tree');

    assert.deepEqual(result, {
      server: 'github.com',
      owner: 'bananas',
      repo: 'peel',
      branch: 'tree',
      valid: true
    });
  });

  test('it generates the checkout URL correctly', assert => {
    let result = git.getCheckoutUrl({
      appId: 'bananas/peel',
      scmUri: 'github.com:12345:master'
    });

    assert.strictEqual(result, 'git@github.com:bananas/peel.git#master');
  });

  test('it parses the org checkout URL correctly', assert => {
    const orgGitUrl = 'org-1000@github.com:bananas/peel.git#tree';

    let result = git.parse(orgGitUrl);

    assert.ok(result.valid, `${orgGitUrl} is valid`);
  });
});
