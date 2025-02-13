import { currentURL, visit } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupApplicationTest } from 'screwdriver-ui/tests/helpers';
import { authenticateSession } from 'ember-simple-auth/test-support';
import Pretender from 'pretender';
import { getPageTitle } from 'ember-page-title/test-support';
let server;

module('Acceptance | secrets', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function () {
    server = new Pretender();

    server.get('http://localhost:8080/v4/pipelines/1', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify({
        id: '1',
        scmUrl: 'git@github.com:foo/bar.git#master',
        createTime: '2016-09-15T23:12:23.760Z',
        admins: { batman: true },
        workflow: ['main', 'publish']
      })
    ]);

    server.get('http://localhost:8080/v4/pipelines/1/secrets', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify([
        { id: 1234, name: 'BATMAN', value: null, allowInPR: false },
        { id: 1235, name: 'ROBIN', value: null, allowInPR: false }
      ])
    ]);

    server.get('http://localhost:8080/v4/pipelines/1/tokens', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify([
        { id: 2345, name: 'foo', description: 'foofoo' },
        { id: 2346, name: 'bar', description: 'barbar' }
      ])
    ]);

    server.get('http://localhost:8080/v4/collections', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify([])
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

  test('visiting /pipelines/:id/secrets', async function (assert) {
    await authenticateSession({ token: 'faketoken' });
    await visit('/pipelines/1/secrets');

    assert.equal(currentURL(), '/pipelines/1/secrets');
    assert.equal(getPageTitle(), 'Secrets', 'Page title is correct');
    assert.dom('.secrets tbody tr').exists({ count: 2 });
    assert.dom('.token-list tbody tr').exists({ count: 2 });
  });
});
