import { module, test } from 'qunit';
import { setupTest } from 'screwdriver-ui/tests/helpers';

module('Unit | Route | v2/pipeline/index', function (hooks) {
  setupTest(hooks);

  test('it exists', function (assert) {
    let route = this.owner.lookup('route:v2/pipeline/index');

    assert.ok(route);
  });
});
