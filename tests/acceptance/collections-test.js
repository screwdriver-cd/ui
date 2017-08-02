import { test } from 'qunit';
import moduleForAcceptance from 'screwdriver-ui/tests/helpers/module-for-acceptance';
import { authenticateSession } from 'screwdriver-ui/tests/helpers/ember-simple-auth';
import Pretender from 'pretender';
let server;

moduleForAcceptance('Acceptance | collections', {
  beforeEach() {
    server = new Pretender();
  },
  afterEach() {
    server.shutdown();
  }
});

test('visiting /search?query=', function (assert) {
  server.post('http://localhost:8080/v4/collections', () => [
    201,
    { 'Content-Type': 'application/json' },
    JSON.stringify({
      id: 3,
      name: 'collection3',
      description: 'description3'
    })
  ]);

  server.get('http://localhost:8080/v4/pipelines', () => [
    201,
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
    ])
  ]);

  server.get('http://localhost:8080/v4/collections', () => [
    200,
    { 'Content-Type': 'application/json' },
    JSON.stringify([
      {
        id: 1,
        name: 'collection1',
        description: 'description1',
        pipelineIds: [1, 2, 3]
      },
      {
        id: 2,
        name: 'collection2',
        description: 'description2',
        pipelineIds: [4, 5, 6]
      }
    ])
  ]);

  authenticateSession(this.application, { token: 'fakeToken' });

  visit('/search?query=');

  andThen(() => {
    assert.equal(find('.flyout').length, 1);
    assert.notOk(find('.modal').length);

    click('.new');

    andThen(() => {
      assert.equal(find('.modal').length, 1);
      fillIn('.name input', 'collection3');
      triggerEvent('.name input', 'keyup');
      fillIn('.description input', 'description3');
      triggerEvent('.description input', 'keyup');
      click('.create');
      andThen(() => {
        // The modal should disappear
        assert.notOk(find('.modal').length);
      });
    });
  });
});

test('visiting /collections/1', function (assert) {
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
      }
    ])
  ]);

  authenticateSession(this.application, { token: 'fakeToken' });

  visit('/collections/1');

  andThen(function () {
    assert.equal(currentURL(), '/collections/1');
    assert.equal(find('.header h2').text().trim(), 'collection1');
    assert.equal(find('.header p').text().trim(), 'description1');
    assert.equal(find('table').length, 1);
    assert.equal(find('th.appId').text().trim(), 'Name');
    assert.equal(find('th.branch').text().trim(), 'Branch');
    assert.equal(find('tr').length, 3);
    assert.equal(find('td').length, 4);
  });
});
