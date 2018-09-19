import { test } from 'qunit';
import { authenticateSession } from 'screwdriver-ui/tests/helpers/ember-simple-auth';
import moduleForAcceptance from 'screwdriver-ui/tests/helpers/module-for-acceptance';
import Pretender from 'pretender';
let server;

moduleForAcceptance('Acceptance | search', {
  beforeEach() {
    server = new Pretender();
    server.get('http://localhost:8080/v4/pipelines', (request) => {
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
      } else if (request.queryParams.search === 'banana') {
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

      return [
        200,
        { 'Content-Type': 'application/json' },
        JSON.stringify([])
      ];
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
  },
  afterEach() {
    server.shutdown();
  }
});

test('visiting /search when not logged in', function (assert) {
  visit('/search');

  andThen(() => {
    assert.equal(currentURL(), '/login');
  });
});

test('visiting /search when logged in', function (assert) {
  authenticateSession(this.application, { token: 'fakeToken' });
  visit('/search');

  andThen(() => {
    assert.equal(currentURL(), '/search');
    assert.equal(find('tr').length, 4);
    assert.equal(find('.showMore').text().trim(), 'Show more results...');
    assert.equal(find('.num-results').text().trim(), 'Showing 3 result(s)');

    click('.showMore');
    andThen(() => {
      assert.equal(find('tr').length, 7);
      assert.equal(find('.showMore').text().trim(), 'Show more results...');
      assert.equal(find('.num-results').text().trim(), 'Showing 6 result(s)');
    });
  });
});

test('visiting /search?query=banana when logged in', function (assert) {
  authenticateSession(this.application, { token: 'fakeToken' });
  visit('/search?query=banana');

  andThen(() => {
    assert.equal(currentURL(), '/search?query=banana');
    assert.equal(find('tr').length, 3);
    assert.notOk(find('.showMore').text().trim());
    assert.equal(find('.num-results').text().trim(), 'Showing 2 result(s)');
  });
});

test('visiting /search?query=doesnotexist when logged in', function (assert) {
  authenticateSession(this.application, { token: 'fakeToken' });
  visit('/search?query=doesnotexist');

  andThen(() => {
    assert.equal(currentURL(), '/search?query=doesnotexist');
    assert.equal(find('tr').length, 1);
    assert.notOk(find('.showMore').text().trim());
    assert.equal(find('.num-results').text().trim(), 'No results');
  });
});
