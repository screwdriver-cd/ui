import { test } from 'qunit';
import moduleForAcceptance from 'screwdriver-ui/tests/helpers/module-for-acceptance';
import { authenticateSession } from 'screwdriver-ui/tests/helpers/ember-simple-auth';
import Pretender from 'pretender';
let server;

moduleForAcceptance('Acceptance | secrets', {
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
        workflow: ['main', 'publish']
      })
    ]);

    server.get('http://localhost:8080/v4/pipelines/1/secrets', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify([
        { id: 1234, name: 'BATMAN', value: null, allowInPR: false },
        { id: 1235, name: 'ROBIN', value: null, allowInPR: false }
      ])
    ]);

    server.get('http://localhost:8080/v4/pipelines/1/tokens', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify([
        { id: 2345, name: 'foo', description: 'foofoo' },
        { id: 2346, name: 'bar', description: 'barbar' }
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

test('visiting /pipelines/:id/secrets', function (assert) {
  authenticateSession(this.application, { token: 'faketoken' });

  visit('/pipelines/1/secrets');

  andThen(() => {
    assert.equal(currentURL(), '/pipelines/1/secrets');
    assert.equal(find('.secrets tbody tr').length, 2);
    assert.equal(find('.token-list tbody tr').length, 2);
  });
});
