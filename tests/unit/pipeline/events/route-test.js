import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | Route | pipeline/events', function (hooks) {
  setupTest(hooks);

  test('it exists', function (assert) {
    const route = this.owner.lookup('route:pipeline/index');

    assert.ok(route);
  });
});
