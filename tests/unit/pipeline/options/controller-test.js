import { run } from '@ember/runloop';
import { moduleFor, test } from 'ember-qunit';
import Pretender from 'pretender';
import wait from 'ember-test-helpers/wait';
let server;

moduleFor('controller:pipeline/options', 'Unit | Controller | pipeline/options', {
  // Specify the other units that are required for this test.
  needs: [
    'adapter:application',
    'model:build',
    'model:event',
    'model:job',
    'model:pipeline',
    'model:secret',
    'serializer:job',
    'serializer:pipeline',
    'service:session',
    'service:store'
  ],
  beforeEach() {
    server = new Pretender();
  },
  afterEach() {
    server.shutdown();
  }
});

test('it handles updating job state', function (assert) {
  server.put('http://localhost:8080/v4/jobs/1234', () => [200, {}, JSON.stringify({ id: 1234 })]);

  let controller = this.subject();

  run(() => {
    controller.store.push({
      data: {
        id: '1234',
        type: 'job',
        attributes: {
          status: 'DISABLED'
        }
      }
    });

    controller.send('setJobStatus', '1234', 'ENABLED');
  });

  return wait().then(() => {
    const [request] = server.handledRequests;
    const payload = JSON.parse(request.requestBody);

    assert.deepEqual(payload, {
      state: 'ENABLED'
    });
  });
});

test('it handles deleting pipelines', function (assert) {
  assert.expect(2);
  server.delete('http://localhost:8080/v4/pipelines/abc1234', () => [200, {}, '{"id": "abc1234"}']);

  let controller = this.subject();

  run(() => {
    controller.store.push({
      data: {
        id: 'abc1234',
        type: 'pipeline',
        attributes: {
          state: 'ENABLED'
        }
      }
    });
    controller.set('model', { pipeline: controller.store.peekRecord('pipeline', 'abc1234') });

    controller.transitionToRoute = (route) => {
      assert.equal(route, 'home');
    };

    controller.send('removePipeline');
  });

  return wait().then(() => {
    assert.ok(true);
  });
});
