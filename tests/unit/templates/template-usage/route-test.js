import { module, test } from 'qunit';
import { setupTest } from 'screwdriver-ui/tests/helpers';

module(
  'Unit | Route | templates/namespace/name/version/usage',
  function (hooks) {
    setupTest(hooks);

    test('it exists', function (assert) {
      let route = this.owner.lookup('route:templates.template-usage');

      assert.ok(route);
    });
  }
);
