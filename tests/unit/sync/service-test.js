import { moduleFor, test } from 'ember-qunit';
import Pretender from 'pretender';
let server;

const sync = () => {
  server.post('http://localhost:8080/v4/pipelines/1/sync/', () => [204]);
};

const syncWithPath = () => {
  server.post('http://localhost:8080/v4/pipelines/1/sync/webhooks', () => [204]);
};

const syncFailed = () => {
  server.post('http://localhost:8080/v4/pipelines/1/sync/', () => [409,
    { 'Content-Type': 'application/json' },
    JSON.stringify({
      statusCode: 409,
      error: 'Conflict',
      message: 'something conflicting'
    })
  ]);
};

moduleFor('service:sync', 'Unit | Service | sync', {
  // Specify the other units that are required for this test.
  needs: ['service:session'],

  beforeEach() {
    server = new Pretender();
  },

  afterEach() {
    server.shutdown();
  }
});

test('it exists', function (assert) {
  const service = this.subject();

  assert.ok(service);
});

test('it makes a call to sync successfully without passing syncPath', function (assert) {
  assert.expect(1);
  sync();
  const service = this.subject();
  const p = service.syncRequests(1, undefined);

  p.then(() => {
    const [request] = server.handledRequests;

    assert.equal(request.url, 'http://localhost:8080/v4/pipelines/1/sync/');
  });
});

test('it makes a call to sync successfully with syncPath', function (assert) {
  assert.expect(1);
  syncWithPath();
  const service = this.subject();
  const p = service.syncRequests(1, 'webhooks');

  p.then(() => {
    const [request] = server.handledRequests;

    assert.equal(request.url, 'http://localhost:8080/v4/pipelines/1/sync/webhooks');
  });
});

test('it fails to sync and rejects with error message ', function (assert) {
  assert.expect(2);
  syncFailed();
  const service = this.subject();
  const p = service.syncRequests(1, undefined);

  p.catch((error) => {
    assert.equal(error, 'something conflicting');
    const [request] = server.handledRequests;

    assert.equal(request.url, 'http://localhost:8080/v4/pipelines/1/sync/');
  });
});
