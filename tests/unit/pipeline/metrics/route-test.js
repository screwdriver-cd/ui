import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | Route | pipeline/metrics', function (hooks) {
  setupTest(hooks);

  test('it exists', function (assert) {
    const route = this.owner.lookup('route:pipeline/metrics');

    assert.ok(route);
  });
});
