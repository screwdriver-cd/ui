import { run } from '@ember/runloop';
import { moduleFor, test } from 'ember-qunit';
import Pretender from 'pretender';
import wait from 'ember-test-helpers/wait';
let server;

moduleFor('controller:pipeline/secrets', 'Unit | Controller | pipeline/secrets', {
  // Specify the other units that are required for this test.
  needs: ['model:secret', 'model:token', 'adapter:application', 'serializer:secret',
    'serializer:token', 'service:session', 'service:pipeline.secrets'],
  beforeEach() {
    server = new Pretender();
  },
  afterEach() {
    server.shutdown();
  }
});

test('it can create secrets', function (assert) {
  server.post('http://localhost:8080/v4/secrets', () => [200, {}, JSON.stringify({ id: 1234 })]);

  let controller = this.subject();

  assert.ok(controller);

  run(() => {
    controller.set('model', {
      secrets: {
        reload() {
          assert.ok(true);
        }
      }
    });

    controller.send('createSecret', 'batman', 'robin', 'abcd', false);
  });

  return wait().then(() => {
    const [request] = server.handledRequests;
    const payload = JSON.parse(request.requestBody);

    assert.deepEqual(payload, {
      pipelineId: 'abcd',
      name: 'batman',
      value: 'robin',
      allowInPR: false
    });
  });
});

test('it can create pipelinetokens', function (assert) {
  server.post('http://localhost:8080/v4/pipelines/1/tokens',
    () => [200, {}, JSON.stringify({ id: 123 })]);

  let controller = this.subject();

  assert.ok(controller);

  run(() => {
    controller.set('model', {
      tokens: {
        reload() {
          assert.ok(true);
        }
      },
      pipeline: {
        id: '1'
      }
    });

    controller.send('createPipelineToken', 'foo', 'bar');
  });

  return wait().then(() => {
    const [request] = server.handledRequests;
    const payload = JSON.parse(request.requestBody);

    assert.deepEqual(payload, {
      name: 'foo',
      description: 'bar'
    });
  });
});

test('it shows errors from server', function (assert) {
  server.post('http://localhost:8080/v4/secrets', () => [
    400,
    {},
    JSON.stringify({
      statusCode: 400,
      error: 'unfortunate',
      message: 'a series of unfortunate events'
    })
  ]);

  let controller = this.subject();

  assert.ok(controller);

  run(() => {
    assert.equal(controller.get('errorMessage'), '');
    controller.send('createSecret', 'batman', 'robin', 'abcd', false);
  });

  return wait().then(() => {
    assert.equal(controller.get('errorMessage'), 'a series of unfortunate events');
  });
});
