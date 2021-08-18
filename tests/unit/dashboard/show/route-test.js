import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | Route | dashboard/show', function (hooks) {
  setupTest(hooks);

  test('it exists', function (assert) {
    let route = this.owner.lookup('route:dashboard/show');

    assert.ok(route);
  });
});
