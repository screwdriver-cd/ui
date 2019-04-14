import { click, fillIn, findAll, currentURL, find, triggerEvent, visit } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupApplicationTest } from 'ember-qunit';
import { authenticateSession } from 'screwdriver-ui/tests/helpers/ember-simple-auth';
import Pretender from 'pretender';
let server;

module('Acceptance | dashboards', function(hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function() {
    server = new Pretender();

    server.get('http://localhost:8080/v4/collections', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify([])
    ]);

    server.get('http://localhost:8080/v4/collections/1', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify([
        {
          id: 1,
          name: 'collection1',
          description: 'description1',
          pipelines: [
            {
              id: 12742,
              scmUri: 'github.com:12345678:master',
              createTime: '2017-01-05T00:55:46.775Z',
              admins: {
                username: true
              },
              workflow: ['main', 'publish'],
              scmRepo: {
                name: 'screwdriver-cd/screwdriver',
                branch: 'master',
                url: 'https://github.com/screwdriver-cd/screwdriver/tree/master'
              },
              scmContext: 'github:github.com',
              annotations: {},
              lastEventId: 12,
              lastBuilds: [
                {
                  id: 123,
                  status: 'SUCCESS'
                },
                {
                  id: 124,
                  status: 'FAILURE'
                }
              ]
            },
            {
              id: 12743,
              scmUri: 'github.com:87654321:master',
              createTime: '2017-01-05T00:55:46.775Z',
              admins: {
                username: true
              },
              workflow: ['main', 'publish'],
              scmRepo: {
                name: 'screwdriver-cd/ui',
                branch: 'master',
                url: 'https://github.com/screwdriver-cd/ui/tree/master'
              },
              scmContext: 'github:github.com',
              annotations: {},
              prs: {
                open: 2,
                failing: 1
              }
            }
          ]
        }
      ])
    ]);
  });

  hooks.afterEach(function() {
    server.shutdown();
  });

  test('visiting / when not logged in', async function(assert) {
    await visit('/');

    assert.equal(currentURL(), '/login');
  });

  test('visiting / when logged in and no collections', async function(assert) {
    authenticateSession(this.application, { token: 'fakeToken' });
    await visit('/');

    assert.equal(currentURL(), '/');
  });

  test('visiting / when logged in and have collections', async function(assert) {
    server.get('http://localhost:8080/v4/collections', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify([
        {
          id: 2,
          name: 'collection2',
          description: 'description2',
          pipelineIds: [4, 5, 6]
        },
        {
          id: 1,
          name: 'collection1',
          description: 'description1',
          pipelineIds: [1, 2, 3]
        }
      ])
    ]);

    authenticateSession(this.application, { token: 'fakeToken' });
    await visit('/');

    assert.equal(currentURL(), '/dashboards/1');
    assert.equal(find('.header__name').textContent.trim(), 'collection1');
    assert.equal(find('.header__description').textContent.trim(), 'description1');
    assert.equal(findAll('table').length, 1);
    assert.equal(find('th.app-id').textContent.trim(), 'Name');
    assert.equal(find('th.branch').textContent.trim(), 'Branch');
    assert.equal(find('th.account').textContent.trim(), 'Account');
    assert.equal(findAll('tr').length, 4);
    assert.equal(findAll('td').length, 14);
  });

  test('visiting /dashboards when not logged in', async function(assert) {
    await visit('/dashboards');

    assert.equal(currentURL(), '/login');
  });

  test('visiting /dashboards when logged in and no collections', async function(assert) {
    authenticateSession(this.application, { token: 'fakeToken' });
    await visit('/dashboards');

    assert.equal(currentURL(), '/');
  });

  test('visiting /dashboards/1', async function(assert) {
    authenticateSession(this.application, { token: 'fakeToken' });

    await visit('/dashboards/1');

    assert.equal(currentURL(), '/dashboards/1');
    assert.equal(find('.header__name').textContent.trim(), 'collection1');
    assert.equal(find('.header__description').textContent.trim(), 'description1');
    assert.equal(findAll('table').length, 1);
    assert.equal(find('th.app-id').textContent.trim(), 'Name');
    assert.equal(find('th.branch').textContent.trim(), 'Branch');
    assert.equal(find('th.account').textContent.trim(), 'Account');
    assert.equal(findAll('tr').length, 4);
    assert.equal(findAll('td').length, 14);
  });

  test('creating a collection', async function(assert) {
    assert.expect(7);

    const expectedRequestBody = {
      name: 'collection3',
      description: 'description3'
    };

    server.post('http://localhost:8080/v4/collections', (request) => {
      assert.deepEqual(JSON.parse(request.requestBody), expectedRequestBody);

      return [
        201,
        { 'Content-Type': 'application/json' },
        JSON.stringify({
          id: 3,
          name: 'collection3',
          description: 'description3'
        })
      ];
    });

    // GET request made in the search route for pipelines
    server.get('http://localhost:8080/v4/pipelines', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify([
        {
          id: 12742,
          scmUri: 'github.com:12345678:master',
          createTime: '2017-01-05T00:55:46.775Z',
          admins: {
            username: true
          },
          workflow: ['main', 'publish'],
          scmRepo: {
            name: 'screwdriver-cd/screwdriver',
            branch: 'master',
            url: 'https://github.com/screwdriver-cd/screwdriver/tree/master'
          },
          scmContext: 'github:github.com',
          annotations: {}
        },
        {
          id: 12743,
          scmUri: 'github.com:87654321:master',
          createTime: '2017-01-05T00:55:46.775Z',
          admins: {
            username: true
          },
          workflow: ['main', 'publish'],
          scmRepo: {
            name: 'screwdriver-cd/ui',
            branch: 'master',
            url: 'https://github.com/screwdriver-cd/ui/tree/master'
          },
          scmContext: 'github:github.com',
          annotations: {}
        }
      ])
    ]);

    authenticateSession(this.application, { token: 'fakeToken' });
    await visit('/');
    // Logged in but no collections, url should be `/`
    assert.equal(currentURL(), '/');

    await visit('/search');
    assert.equal(findAll('.flyout').length, 1);
    assert.notOk(findAll('.modal').length);
    assert.notOk(findAll('.collection-wrapper row').length);

    await click('.new');
    assert.equal(findAll('.modal').length, 1);
    await fillIn('.name input', 'collection3');
    await triggerEvent('.name input', 'keyup');
    await fillIn('.description textarea', 'description3');
    await triggerEvent('.description textarea', 'keyup');
    await click('.collection-form__create');
    // The modal should disappear
    assert.notOk(findAll('.modal').length);
  });
});
