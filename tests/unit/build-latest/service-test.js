import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | Service | build-latest', function(hooks) {
  setupTest(hooks);

  // Replace this with your real tests.
  test('it exists', function(assert) {
    let service = this.owner.lookup('service:build-latest');

    assert.ok(service);
  });
});
