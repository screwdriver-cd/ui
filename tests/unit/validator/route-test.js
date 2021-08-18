import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | Route | validator', function (hooks) {
  setupTest(hooks);

  test('it exists', function (assert) {
    const route = this.owner.lookup('route:validator');

    assert.ok(route);
  });
});
