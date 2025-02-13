import { currentURL, visit } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupApplicationTest } from 'screwdriver-ui/tests/helpers';
import { authenticateSession } from 'ember-simple-auth/test-support';
import Pretender from 'pretender';
import { getPageTitle } from 'ember-page-title/test-support';
let server;

module('Acceptance | child pipeline', function (hooks) {
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
        workflow: ['main', 'publish'],
        childPipelines: {
          scmUrls: [
            'git@github.com:child/one.git#master',
            'git@github.com:child/two.git#master'
          ]
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
          },
          state: 'ACTIVE'
        },
        {
          id: '3',
          scmUrl: 'git@github.com:child/two.git#master',
          scmRepo: {
            name: 'child/two',
            branch: 'master',
            url: 'https://github.com/child/two'
          },
          state: 'INACTIVE'
        }
      ])
    ]);

    server.get('http://localhost:8080/v4/collections', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify([])
    ]);

    server.get('http://localhost:8080/v4/pipelines/1/latestCommitEvent', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify({ id: '2', sha: 'abcdef1029384' })
    ]);

    server.get('http://localhost:8080/v4/banners', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify([
        {
          id: 1,
          isActive: true,
          message: 'shutdown imminent'
        }
      ])
    ]);
  });

  hooks.afterEach(function () {
    server.shutdown();
  });

  test('visiting /pipelines/:id/child-pipelines', async function (assert) {
    await authenticateSession({ token: 'faketoken' });
    await visit('/pipelines/1/child-pipelines');

    assert.equal(currentURL(), '/pipelines/1/child-pipelines');
    assert.dom('.banner').hasText('× shutdown imminent');
    assert.equal(getPageTitle(), 'Child Pipelines', 'Page title is correct');
    assert.dom('.appId:nth-child(1)').hasText('Name');
    assert.dom('tbody tr:first-child td.appId').hasText('child/one');
    assert.dom('tbody tr:first-child td.branch').hasText('master');
    assert.dom('tbody tr:nth-child(2) td.appId').hasText('child/two');
    assert.dom('tbody tr:nth-child(2) td.branch').hasText('master');
    assert
      .dom('div.alert > span')
      .hasText(
        'You have one or more inactive pipelines. You can activate these by adding back the corresponding SCM URL in the yaml configuration.'
      );
  });
});
