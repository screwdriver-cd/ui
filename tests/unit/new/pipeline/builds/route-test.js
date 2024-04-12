import { module, test } from 'qunit';
import { setupTest } from 'screwdriver-ui/tests/helpers';

module('Unit | Route | new/pipeline/builds', function (hooks) {
  setupTest(hooks);

  test('it exists', function (assert) {
    let route = this.owner.lookup('route:new/pipeline/builds');

    assert.ok(route);
  });
});
