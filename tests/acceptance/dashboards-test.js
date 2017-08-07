import { test } from 'qunit';
import moduleForAcceptance from 'screwdriver-ui/tests/helpers/module-for-acceptance';
import { authenticateSession } from 'screwdriver-ui/tests/helpers/ember-simple-auth';
import Pretender from 'pretender';
let server;

// This file tests all the dashboards routing logic
moduleForAcceptance('Acceptance | dashboards', {
  beforeEach() {
    server = new Pretender();

    server.get('http://localhost:8080/v4/collections', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify([])
    ]);
  },
  afterEach() {
    server.shutdown();
  }
});

test('visiting / when not logged in', function (assert) {
  visit('/');

  andThen(() => {
    assert.equal(currentURL(), '/');
  });
});

test('visiting / when logged in and no collections', function (assert) {
  authenticateSession(this.application, { token: 'fakeToken' });
  visit('/');

  andThen(() => {
    assert.equal(currentURL(), '/');
  });
});

test('visiting / when logged in and have collections', function (assert) {
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

  server.get('http://localhost:8080/v4/collections/1', () => [
    200,
    { 'Content-Type': 'application/json' },
    JSON.stringify({
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
          annotations: {}
        }
      ]
    })
  ]);

  authenticateSession(this.application, { token: 'fakeToken' });
  visit('/');

  andThen(() => {
    assert.equal(currentURL(), '/dashboards/1');
    assert.equal(find('.header h2').text().trim(), 'collection1');
    assert.equal(find('.header p').text().trim(), 'description1');
    assert.equal(find('table').length, 1);
    assert.equal(find('th.app-id').text().trim(), 'Name');
    assert.equal(find('th.branch').text().trim(), 'Branch');
    assert.equal(find('tr').length, 3);
    assert.equal(find('td').length, 4);
  });
});

test('visiting /dashboards when not logged in', function (assert) {
  visit('/dashboards');

  andThen(() => {
    assert.equal(currentURL(), '/login');
  });
});

test('visiting /dashboards when logged in and no collections', function (assert) {
  authenticateSession(this.application, { token: 'fakeToken' });
  visit('/dashboards');

  andThen(() => {
    assert.equal(currentURL(), '/');
  });
});
