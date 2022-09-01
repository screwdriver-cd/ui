import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | Route | user-settings/access-tokens', function (hooks) {
  setupTest(hooks);

  test('it exists', function (assert) {
    let route = this.owner.lookup('route:user-settings/access-tokens');

    assert.ok(route);
    assert.equal(route.titleToken, 'Access Tokens');
  });
});
