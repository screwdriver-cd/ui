import { currentURL, visit } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupApplicationTest } from 'screwdriver-ui/tests/helpers';
import { authenticateSession } from 'ember-simple-auth/test-support';
import Pretender from 'pretender';
let server;

module('Acceptance | pipeline/options', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function () {
    server = new Pretender();

    server.get('http://localhost:8080/v4/pipelines/1', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify({
        id: '1',
        scmUrl: 'git@github.com:foo/bar.git#master',
        scmUri: 'github.com:84604643:master',
        scmRepo: {
          branch: 'master',
          name: 'foo/bar',
          url: 'https://github.com/foo/bar/tree/master'
        },
        createTime: '2016-09-15T23:12:23.760Z',
        admins: { batman: true },
        workflow: ['main', 'publish']
      })
    ]);

    server.get('http://localhost:8080/v4/pipelines/1/jobs', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify([
        { id: 1234, name: 'main', state: 'ENABLED' },
        { id: 1235, name: 'publish', state: 'ENABLED' }
      ])
    ]);

    server.get('http://localhost:8080/v4/collections', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify([])
    ]);

    server.get('http://localhost:8080/v4/users/settings', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify({})
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

  test('visiting /pipelines/:id/options', async function (assert) {
    await authenticateSession({ token: 'faketoken' });
    await visit('/pipelines/1/options');

    assert.equal(currentURL(), '/pipelines/1/options');
    assert.dom('#banners').exists({ count: 1 });
    assert.dom('section.pipeline li').exists({ count: 6 });
    assert.dom('section.jobs li').exists({ count: 3 });
    assert.dom('section.danger li').exists({ count: 1 });
  });
});
