import { currentURL, visit } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupApplicationTest } from 'ember-qunit';
import { authenticateSession } from 'ember-simple-auth/test-support';
import Pretender from 'pretender';
import { hasCollections } from 'screwdriver-ui/tests/mock/collections';

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
  });

  hooks.afterEach(function () {
    server.shutdown();
  });

  test('visiting /user-settings', async function (assert) {
    await authenticateSession({ token: 'faketoken' });
    await visit('/user-settings');

    assert.equal(currentURL(), '/user-settings');
    assert.dom('.token-list tbody tr').exists({ count: 2 });
    assert.dom('section.preference li').exists({ count: 2 });
  });
});
