import { click, currentURL, visit } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupApplicationTest } from 'ember-qunit';
import { authenticateSession } from 'ember-simple-auth/test-support';
import Pretender from 'pretender';
let server;

module('Acceptance | search', function(hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function() {
    server = new Pretender();
    server.get('http://localhost:8080/v4/pipelines', request => {
      if (!request.queryParams.search) {
        return [
          200,
          { 'Content-Type': 'application/json' },
          JSON.stringify([
            {
              id: '1',
              scmUrl: 'git@github.com:foo/bar.git#master',
              scmRepo: {
                name: 'foo/bar',
                url: 'git@github.com:foo/bar.git#master',
                branch: 'master'
              },
              scmContext: 'github:github.com',
              createTime: '2016-09-15T23:12:23.760Z',
              admins: { batman: true },
              workflow: ['main', 'publish']
            },
            {
              id: '2',
              scmUrl: 'git@github.com:foo/bar2.git#banana',
              scmRepo: {
                name: 'foo/bar2',
                url: 'git@github.com:foo/bar2.git#master',
                branch: 'master'
              },
              scmContext: 'github:github.com',
              createTime: '2016-09-15T23:12:23.760Z',
              admins: { batman: true },
              workflow: ['main', 'publish']
            },
            {
              id: '3',
              scmUrl: 'git@github.com:foo/bar3.git#cucumber',
              scmRepo: {
                name: 'foo/bar3',
                url: 'git@github.com:foo/bar3.git#master',
                branch: 'master'
              },
              scmContext: 'github:github.com',
              createTime: '2016-09-15T23:12:23.760Z',
              admins: { batman: true },
              workflow: ['main', 'publish']
            }
          ])
        ];
      }
      if (request.queryParams.search === 'banana') {
        return [
          200,
          { 'Content-Type': 'application/json' },
          JSON.stringify([
            {
              id: '1',
              scmUrl: 'git@github.com:banana/bar.git#master',
              scmRepo: {
                name: 'foo/bar',
                url: 'git@github.com:foo/bar.git#master',
                branch: 'master'
              },
              scmContext: 'github:github.com',
              createTime: '2016-09-15T23:12:23.760Z',
              admins: { batman: true },
              workflow: ['main', 'publish']
            },
            {
              id: '2',
              scmUrl: 'git@github.com:banana/bar2.git#banana',
              scmRepo: {
                name: 'foo/bar2',
                url: 'git@github.com:foo/bar2.git#master',
                branch: 'master'
              },
              scmContext: 'github:github.com',
              createTime: '2016-09-15T23:12:23.760Z',
              admins: { batman: true },
              workflow: ['main', 'publish']
            }
          ])
        ];
      }

      return [200, { 'Content-Type': 'application/json' }, JSON.stringify([])];
    });

    server.get('http://localhost:8080/v4/collections', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify([
        {
          id: '1',
          name: 'collection1',
          description: 'description1',
          pipelineIds: [1, 2, 3]
        }
      ])
    ]);
  });

  hooks.afterEach(function() {
    server.shutdown();
  });

  test('visiting /search when not logged in', async function(assert) {
    await visit('/search');

    assert.equal(currentURL(), '/login');
  });

  test('visiting /search when logged in', async function(assert) {
    await authenticateSession({ token: 'fakeToken' });
    await visit('/search');

    assert.equal(currentURL(), '/search');
    assert.dom('tr').exists({ count: 4 });
    assert.dom('.showMore').hasText('Show more results...');
    assert.dom('.num-results').hasText('Showing 3 result(s)');

    await click('.showMore');
    assert.dom('tr').exists({ count: 7 });
    assert.dom('.showMore').hasText('Show more results...');
    assert.dom('.num-results').hasText('Showing 6 result(s)');
  });

  test('visiting /search?query=banana when logged in', async function(assert) {
    await authenticateSession({ token: 'fakeToken' });
    await visit('/search?query=banana');

    assert.equal(currentURL(), '/search?query=banana');
    assert.dom('tr').exists({ count: 3 });
    assert.dom('.showMore').doesNotExist();
    assert.dom('.num-results').hasText('Showing 2 result(s)');
  });

  test('visiting /search?query=doesnotexist when logged in', async function(assert) {
    await authenticateSession({ token: 'fakeToken' });
    await visit('/search?query=doesnotexist');

    assert.equal(currentURL(), '/search?query=doesnotexist');
    assert.dom('tr').exists({ count: 1 });
    assert.dom('.showMore').doesNotExist();
    assert.dom('.num-results').hasText('No results');
  });
});
