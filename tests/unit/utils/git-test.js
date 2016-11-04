import git from 'screwdriver-ui/utils/git';
import { module, test } from 'qunit';

module('Unit | Utility | git');

// Replace this with your real tests.
test('it works', (assert) => {
  let result = git.parse('bananas');

  assert.notOk(result.valid);

  result = git.parse('git@github.com:bananas/peel.git');

  assert.deepEqual(result, {
    server: 'github.com',
    owner: 'bananas',
    repo: 'peel',
    branch: 'master',
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
