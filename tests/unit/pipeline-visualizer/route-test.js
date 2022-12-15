import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | Route | pipeline-visualizer', function (hooks) {
  setupTest(hooks);

  test('it exists', function (assert) {
    const route = this.owner.lookup('route:pipeline-visualizer');

    assert.ok(route);
  });
});
