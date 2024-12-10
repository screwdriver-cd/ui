import { module, test } from 'qunit';
import { setupTest } from 'screwdriver-ui/tests/helpers';
import {
  getPrJobsMap,
  getPrNumber,
  getPrNumbers,
  newestPrNumber,
  oldestPrNumber
} from 'screwdriver-ui/utils/pipeline/pull-request';

module('Unit | Route | utils/pipeline/pull-request', function (hooks) {
  setupTest(hooks);

  test('getPrNumber returns correct value', function (assert) {
    assert.equal(getPrNumber({ name: 'PR-3:foo' }), 3);
  });

  test('getPrNumbers returns correct set of values', function (assert) {
    assert.equal(getPrNumbers([]).size, 0);

    const prNumbers = getPrNumbers([
      { name: 'PR-3:foo' },
      { name: 'PR-4:foo' }
    ]);

    assert.equal(prNumbers.size, 2);
    assert.equal(prNumbers.has(3), true);
    assert.equal(prNumbers.has(4), true);
  });

  test('newestPrNumber returns correct value', function (assert) {
    assert.equal(newestPrNumber(new Set([1, 2, 3, 9, 6])), 9);
    assert.equal(newestPrNumber(new Set()), null);
  });

  test('oldestPrNumber returns correct value', function (assert) {
    assert.equal(oldestPrNumber(new Set([1, 2, 3, 9, 6])), 1);
    assert.equal(oldestPrNumber(new Set()), null);
  });

  test('getPrJobsMap returns correct map', function (assert) {
    const jobs = [
      { name: 'PR-3:foo' },
      { name: 'PR-4:foo' },
      { name: 'PR-3:bar' }
    ];

    const prJobsMap = getPrJobsMap(jobs);

    assert.equal(prJobsMap.size, 2);
    assert.equal(prJobsMap.get(3).length, 2);
    assert.equal(prJobsMap.get(4).length, 1);
  });
});
