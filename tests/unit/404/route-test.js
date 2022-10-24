import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | Route | 404', function (hooks) {
  setupTest(hooks);

  test('it exists', function (assert) {
    const route = this.owner.lookup('route:404');

    assert.ok(route);
  });
});
