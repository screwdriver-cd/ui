import { visit } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupApplicationTest } from 'screwdriver-ui/tests/helpers';
import { authenticateSession } from 'ember-simple-auth/test-support';
import Pretender from 'pretender';
import { hasCollections } from 'screwdriver-ui/tests/mock/collections';
import { getPageTitle } from 'ember-page-title/test-support';

let server;

module('Acceptance | tokens', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function () {
    server = new Pretender();

    server.get('http://localhost:8080/v4/collections', hasCollections);
    server.get('http://localhost:8080/v4/tokens', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify([
        {
          id: '1',
          name: 'foo',
          description: 'bar',
          lastUsed: '2016-09-15T23:12:23.760Z'
        },
        {
          id: '2',
          name: 'baz',
          lastUsed: ''
        }
      ])
    ]);

    server.get('http://localhost:8080/v4/banners', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify([])
    ]);
  });

  hooks.afterEach(function () {
    server.shutdown();
  });

  test('visiting /user-settings/access-tokens', async function (assert) {
    await authenticateSession({ token: 'faketoken' });
    await visit('/user-settings/access-tokens');

    assert.dom('.token-list tbody tr').exists({ count: 2 });
    assert.equal(
      getPageTitle(),
      'User Settings > Access Tokens',
      'Page title is correct'
    );
  });
});
