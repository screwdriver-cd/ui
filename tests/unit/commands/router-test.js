import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | Route | commands', function (hooks) {
  setupTest(hooks);

  test('it exists', function (assert) {
    let route = this.owner.lookup('route:commands');

    assert.ok(route);
    assert.equal(route.titleToken, 'Commands');
  });
});
