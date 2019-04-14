import { currentURL, visit } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupApplicationTest } from 'ember-qunit';
import { authenticateSession } from 'screwdriver-ui/tests/helpers/ember-simple-auth';
import Pretender from 'pretender';
let server;

module('Acceptance | child pipeline', function(hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function() {
    server = new Pretender();

    server.get('http://localhost:8080/v4/pipelines/1', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify({
        id: '1',
        scmUrl: 'git@github.com:foo/bar.git#master',
        createTime: '2016-09-15T23:12:23.760Z',
        admins: { batman: true },
        workflow: ['main', 'publish'],
        childPipelines: {
          scmUrls: ['git@github.com:child/one.git#master', 'git@github.com:child/two.git#master']
        }
      })
    ]);

    server.get('http://localhost:8080/v4/pipelines', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify([
        {
          id: '2',
          scmUrl: 'git@github.com:child/one.git#master',
          scmRepo: {
            name: 'child/one',
            branch: 'master',
            url: 'https://github.com/child/one'
          }
        },
        {
          id: '3',
          scmUrl: 'git@github.com:child/two.git#master',
          scmRepo: {
            name: 'child/two',
            branch: 'master',
            url: 'https://github.com/child/two'
          }
        }
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

  test('visiting /pipelines/:id/child-pipelines', async function(assert) {
    authenticateSession(this.application, { token: 'faketoken' });

    await visit('/pipelines/1/child-pipelines');

    assert.equal(currentURL(), '/pipelines/1/child-pipelines');
    assert.dom('.appId:nth-child(1)').hasText('child/one');
    assert.dom('.appId:nth-child(2)').hasText('child/two');
  });
});
