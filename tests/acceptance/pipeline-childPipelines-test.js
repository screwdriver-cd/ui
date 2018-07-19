import { test } from 'qunit';
import moduleForAcceptance from 'screwdriver-ui/tests/helpers/module-for-acceptance';
import { authenticateSession } from 'screwdriver-ui/tests/helpers/ember-simple-auth';
import Pretender from 'pretender';
let server;

moduleForAcceptance('Acceptance | child pipeline', {
  beforeEach() {
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
  },
  afterEach() {
    server.shutdown();
  }
});

test('visiting /pipelines/:id/child-pipelines', function (assert) {
  authenticateSession(this.application, { token: 'faketoken' });

  visit('/pipelines/1/child-pipelines');

  andThen(() => {
    assert.equal(currentURL(), '/pipelines/1/child-pipelines');
    assert.equal(find('.appId:nth-child(1)').text().trim(), 'child/one');
    assert.equal(find('.appId:nth-child(2)').text().trim(), 'child/two');
  });
});
