import { moduleFor, test } from 'ember-qunit';
import Pretender from 'pretender';
let server;

const startAll = () => {
  server.post('http://localhost:8080/v4/pipelines/1/startall', () => [204]);
};

const startAllFailed = () => {
  server.post('http://localhost:8080/v4/pipelines/1/startall', () => [500,
    { 'Content-Type': 'application/json' },
    JSON.stringify({
      statusCode: 500,
      message: 'internal server error'
    })
  ]);
};

moduleFor('service:pipeline-startall', 'Unit | Service | sync', {
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

test('it makes a call start all child pipelines', function (assert) {
  assert.expect(1);
  startAll();
  const service = this.subject();
  const p = service.startAll(1, undefined);

  p.then(() => {
    const [request] = server.handledRequests;

    assert.equal(request.url, 'http://localhost:8080/v4/pipelines/1/startall');
  });
});

test('it fails to stall all child piplines with error message ', function (assert) {
  assert.expect(2);
  startAllFailed();
  const service = this.subject();
  const p = service.startAll(1, undefined);

  p.catch((error) => {
    assert.equal(error, 'internal server error');
    const [request] = server.handledRequests;

    assert.equal(request.url, 'http://localhost:8080/v4/pipelines/1/startall');
  });
});
