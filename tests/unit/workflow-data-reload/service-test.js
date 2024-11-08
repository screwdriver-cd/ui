import { module, test } from 'qunit';
import { setupTest } from 'screwdriver-ui/tests/helpers';

module('Unit | Service | workflowDataReload', function (hooks) {
  setupTest(hooks);

  test('it exists', function (assert) {
    const service = this.owner.lookup('service:workflow-data-reload');

    assert.ok(service);
  });
});
