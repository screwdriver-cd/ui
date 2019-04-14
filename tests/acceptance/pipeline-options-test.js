import { findAll, currentURL, visit } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupApplicationTest } from 'ember-qunit';
import { authenticateSession } from 'screwdriver-ui/tests/helpers/ember-simple-auth';
import Pretender from 'pretender';
let server;

module('Acceptance | pipeline/options', function(hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function() {
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
  });

  hooks.afterEach(function() {
    server.shutdown();
  });

  test('visiting /pipelines/:id/options', async function(assert) {
    authenticateSession(this.application, { token: 'faketoken' });

    await visit('/pipelines/1/options');

    assert.equal(currentURL(), '/pipelines/1/options');
    assert.equal(findAll('section.pipeline li').length, 1);
    assert.equal(findAll('section.jobs li').length, 3);
    assert.equal(findAll('section.danger li').length, 1);
  });
});
