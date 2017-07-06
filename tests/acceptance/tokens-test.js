import { test } from 'qunit';
import moduleForAcceptance from 'screwdriver-ui/tests/helpers/module-for-acceptance';
import { authenticateSession } from 'screwdriver-ui/tests/helpers/ember-simple-auth';
import Pretender from 'pretender';
let server;

moduleForAcceptance('Acceptance | tokens', {
  beforeEach() {
    server = new Pretender();

    server.get('http://localhost:8080/v4/tokens', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify([
        {
          id: '1',
          name: 'foo',
          description: 'bar',
          lastUsed: '2016-09-15T23:12:23.760Z'
        }, {
          id: '2',
          name: 'baz',
          lastUsed: ''
        }])
    ]);
  },
  afterEach() {
    server.shutdown();
  }
});

test('visiting /user-settings', function (assert) {
  authenticateSession(this.application, { token: 'faketoken' });

  visit('/user-settings');

  andThen(() => {
    assert.equal(find('.token-list tbody tr').length, 2);
  });
});
