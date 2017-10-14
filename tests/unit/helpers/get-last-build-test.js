import { A } from '@ember/array';
import { getLastBuild } from 'screwdriver-ui/helpers/get-last-build';
import { module, test } from 'qunit';

module('Unit | Helper | get last build');

test('it returns the last build', function (assert) {
  // eslint-disable-next-line new-cap
  let result = getLastBuild([A(['obj1', 'obj2'])]);

  assert.deepEqual(result, 'obj1');
});

test('it returns empty string when builds array is empty', function (assert) {
  // eslint-disable-next-line new-cap
  let result = getLastBuild([[]]);

  assert.notOk(result);
  assert.deepEqual(result, '');
});
