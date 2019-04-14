
import { indexOf } from 'screwdriver-ui/helpers/index-of';
import { module, test } from 'qunit';

module('Unit | Helper | index of', function() {
  // Replace this with your real tests.
  test('it works', function (assert) {
    assert.equal(indexOf([['a', 'b', 'c'], 0]), 'a');
    assert.equal(indexOf([['a', 'b', 'c'], 1]), 'b');
    assert.equal(indexOf([['a', 'b', 'c'], 2]), 'c');
  });
});
