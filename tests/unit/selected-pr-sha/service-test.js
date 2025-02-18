import { module, test } from 'qunit';
import { setupTest } from 'screwdriver-ui/tests/helpers';

module('Unit | Service | selectedPrSha', function (hooks) {
  setupTest(hooks);

  test('it exists', function (assert) {
    const service = this.owner.lookup('service:selected-pr-sha');

    assert.ok(service);
  });

  test('it matches partial sha correctly', function (assert) {
    const service = this.owner.lookup('service:selected-pr-sha');
    const sha = '1234567890abcdef';

    service.setSha(sha);

    assert.equal(service.isEventSelected({ sha }), true);
    assert.equal(service.isEventSelected({ sha: '1' }), true);
    assert.equal(service.isEventSelected({ sha: 'a' }), false);
  });
});
