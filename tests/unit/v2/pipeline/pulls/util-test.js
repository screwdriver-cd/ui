import { module, test } from 'qunit';
import { setupTest } from 'screwdriver-ui/tests/helpers';
import {
  getPrNumber,
  newestPrNumber
} from 'screwdriver-ui/v2/pipeline/pulls/util';

module('Unit | Route | v2/pipeline/pulls/util', function (hooks) {
  setupTest(hooks);

  test('getPrNumber returns correct value', function (assert) {
    assert.equal(getPrNumber({ name: 'PR-3:foo' }), 3);
  });

  test('newestPrNumber returns correct value', function (assert) {
    assert.equal(newestPrNumber(new Set([1, 2, 3, 9, 6])), 9);
    assert.equal(newestPrNumber(new Set()), null);
  });
});
