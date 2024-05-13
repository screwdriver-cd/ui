import { module, test } from 'qunit';
import { setupTest } from 'screwdriver-ui/tests/helpers';

module('Unit | Adapter | build history', function (hooks) {
  setupTest(hooks);

  // Replace this with your real tests.
  test('it exists', function (assert) {
    const adapter = this.owner.lookup('adapter:build-history');

    assert.ok(adapter);
  });

  test('it returns endpoint for builds statuses', function (assert) {
    const adapter = this.owner.lookup('adapter:build-history');
    const buildsStatusesUrl = 'http://localhost:8080/v4/builds/statuses';

    assert.equal(adapter.urlForQuery(), buildsStatusesUrl);
  });
});
