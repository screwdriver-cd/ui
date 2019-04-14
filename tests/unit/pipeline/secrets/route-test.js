import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | Route | pipeline/secrets', function(hooks) {
  setupTest(hooks);

  test('it exists', function (assert) {
    let route = this.owner.lookup('route:pipeline/secrets');

    assert.ok(route);
    assert.equal(route.titleToken, 'Secrets');
  });
});
