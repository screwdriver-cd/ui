import { visit } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupApplicationTest } from 'screwdriver-ui/tests/helpers';
import { getPageTitle } from 'ember-page-title/test-support';

module('Acceptance | tokens', function (hooks) {
  const mockApi = setupApplicationTest(hooks);

  test('visiting /user-settings/access-tokens', async function (assert) {
    mockApi.get('/tokens', () => [
      200,
      [
        {
          id: '1',
          name: 'foo',
          description: 'bar',
          lastUsed: '2016-09-15T23:12:23.760Z',
          expiresAt: '2017-09-15T23:12:23.760Z',
          options: {
            permission: 'read'
          }
        },
        {
          id: '2',
          name: 'baz',
          lastUsed: ''
        }
      ]
    ]);

    await visit('/user-settings/access-tokens');

    assert.dom('#tokens-table tbody tr').exists({ count: 2 });
    assert
      .dom('#tokens-table tbody tr:nth-child(1) .permission-column')
      .hasText('read');
    assert
      .dom('#tokens-table tbody tr:nth-child(2) .permission-column')
      .hasText('all');
    assert.equal(
      getPageTitle(),
      'User Settings > Access Tokens',
      'Page title is correct'
    );
  });
});
