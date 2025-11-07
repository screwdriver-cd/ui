import { visit, currentURL } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupApplicationTest } from 'screwdriver-ui/tests/helpers';
import { getPageTitle } from 'ember-page-title/test-support';
import { invalidateSession } from 'ember-simple-auth/test-support';

module('Acceptance | logins', function (hooks) {
  setupApplicationTest(hooks);

  test('visiting /login', async assert => {
    await invalidateSession();
    await visit('/login');

    assert.equal(currentURL(), '/login');
    assert.equal(getPageTitle(), 'Login', 'Page title is correct');
  });
});
