import { test } from 'qunit';
import moduleForAcceptance from 'screwdriver-ui/tests/helpers/module-for-acceptance';
import { authenticateSession } from 'screwdriver-ui/tests/helpers/ember-simple-auth';
import Pretender from 'pretender';
let server;

moduleForAcceptance('Acceptance | pipeline/options', {
  beforeEach() {
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
  },
  afterEach() {
    server.shutdown();
  }
});

test('visiting /pipelines/:id/options', function (assert) {
  authenticateSession(this.application, { token: 'faketoken' });

  visit('/pipelines/1/options');

  andThen(() => {
    assert.equal(currentURL(), '/pipelines/1/options');
    assert.equal(find('section.pipeline li').length, 1);
    assert.equal(find('section.jobs li').length, 2);
    assert.equal(find('section.danger li').length, 1);
  });
});
