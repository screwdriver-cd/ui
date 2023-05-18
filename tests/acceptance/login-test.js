import { visit, currentURL } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupApplicationTest } from 'ember-qunit';
import { getPageTitle } from 'ember-page-title/test-support';

module('Acceptance | commands', function (hooks) {
  setupApplicationTest(hooks);

  test('visiting /login', async assert => {
    await visit('/login');

    assert.equal(currentURL(), '/login');
    assert.equal(getPageTitle(), 'Login', 'Page title is correct');
  });
});
