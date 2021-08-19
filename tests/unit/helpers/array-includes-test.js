import { arrayIncludes } from 'screwdriver-ui/helpers/array-includes';
import { module, test } from 'qunit';

module('Unit | Helper | array includes', function () {
  test('it works', function (assert) {
    assert.ok(arrayIncludes(['val1', 'val1']));
    assert.notOk(arrayIncludes(['foo', 'val1']));
    assert.ok(arrayIncludes(['val1', ['val1', 'val2']]));
    assert.notOk(arrayIncludes(['foo', ['val1', 'val2']]));
  });
});
