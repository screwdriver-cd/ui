import { module, test } from 'qunit';
import { setupTest } from 'screwdriver-ui/tests/helpers';

module('Unit | Route | pipeline/job-latest-build/artifacts', function (hooks) {
  setupTest(hooks);

  test('it exists', function (assert) {
    const route = this.owner.lookup(
      'route:pipeline/job-latest-build/artifacts'
    );

    assert.ok(route);
  });
});
