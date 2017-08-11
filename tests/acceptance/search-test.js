import { test } from 'qunit';
import moduleForAcceptance from 'screwdriver-ui/tests/helpers/module-for-acceptance';
import Pretender from 'pretender';
let server;

moduleForAcceptance('Acceptance | search', {
  beforeEach() {
    server = new Pretender();
    server.get('http://localhost:8080/v4/pipelines', () => [
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
          createTime: '2016-09-15T23:12:23.760Z',
          admins: { batman: true },
          workflow: ['main', 'publish']
        }
      ])
    ]);

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

test('visiting /search', function (assert) {
  visit('/search');

  andThen(() => {
    assert.equal(currentURL(), '/search');
    assert.equal(find('tr').length, 4);
    assert.equal(find('.num-results').text().trim(), 'Found 3 result(s)');
  });
});
