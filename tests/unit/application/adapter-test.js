import { moduleFor, test } from 'ember-qunit';
import Pretender from 'pretender';

let server;

moduleFor('adapter:application', 'Unit | Adapter | application', {
  // Specify the other units that are required for this test.
  // needs: ['serializer:foo']
  beforeEach() {
    server = new Pretender();
  },

  afterEach() {
    server.shutdown();
  }
});

test('it exists', function (assert) {
  let adapter = this.subject();

  assert.ok(adapter);
});

test('it uses cors for ajax', function (assert) {
  assert.expect(3);

  server.get('fakeurl', () => [200, { 'content-type': 'application/json' }, '{"foo": "bar"}']);

  server.handledRequest = function (verb, path, request) {
    assert.equal(verb, 'GET');
    assert.equal(request.withCredentials, true);
  };

  let adapter = this.subject();

  return adapter.ajax('fakeurl', 'GET').then(response => {
    assert.deepEqual(response, { foo: 'bar' });
  });
});
