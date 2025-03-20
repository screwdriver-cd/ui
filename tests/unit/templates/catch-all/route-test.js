import { module, test } from 'qunit';
import { setupTest } from 'screwdriver-ui/tests/helpers';
import { visit, currentURL } from '@ember/test-helpers';
import { authenticateSession } from 'ember-simple-auth/test-support';

module('Unit | Route | templates/catch-all', function (hooks) {
  setupTest(hooks);

  hooks.beforeEach(function () {
    const banners = this.owner.lookup('service:banners');

    banners.globalBanners = [];
  });

  test('visiting /templates/namespace', async function (assert) {
    await visit('/templates/job/namespace');

    assert.equal(currentURL(), '/login');
  });

  test('visiting /templates/namespace/name', async function (assert) {
    await visit('/templates/job/namespace/name');

    assert.equal(currentURL(), '/login');
  });

  test('visiting authed /templates/namespace', async function (assert) {
    await authenticateSession({ token: 'fakeToken' });
    await visit('/templates/job/namespace');

    assert.equal(currentURL(), '/templates/job/namespace');
  });

  test('visiting authed /templates/namespace', async function (assert) {
    await authenticateSession({ token: 'fakeToken' });
    await visit('/templates/job/namespace/name');

    assert.equal(currentURL(), '/templates/job/namespace/name');
  });
});
