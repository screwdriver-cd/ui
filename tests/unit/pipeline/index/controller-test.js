import EmberObject from '@ember/object';
import { run } from '@ember/runloop';
import { moduleFor, test } from 'ember-qunit';
import Pretender from 'pretender';
import wait from 'ember-test-helpers/wait';
let server;

moduleFor('controller:pipeline/index', 'Unit | Controller | pipeline/index', {
  // Specify the other units that are required for this test.
  // eslint-disable-next-line max-len
  needs: ['model:build', 'model:event', 'adapter:application', 'service:session', 'serializer:build', 'serializer:event'],
  beforeEach() {
    server = new Pretender();
  },
  afterEach() {
    server.shutdown();
  }
});

test('it exists', function (assert) {
  let controller = this.subject();

  assert.ok(controller);
});

test('it starts a build', function (assert) {
  assert.expect(7);
  server.post('http://localhost:8080/v4/events', () => [
    201,
    { 'Content-Type': 'application/json' },
    JSON.stringify({
      id: '5678',
      pipelineId: '1234'
    })
  ]);

  let controller = this.subject();

  run(() => {
    controller.set('model', {
      pipeline: EmberObject.create({
        id: '1234'
      }),
      events: EmberObject.create({
        reload: () => {
          assert.ok(true);

          return Promise.resolve({});
        }
      })
    });

    controller.transitionToRoute = (path, id) => {
      assert.equal(path, 'pipeline');
      assert.equal(id, 1234);
    };

    assert.notOk(controller.get('isShowingModal'));
    controller.send('startMainBuild');
    assert.ok(controller.get('isShowingModal'));
  });

  return wait().then(() => {
    const [request] = server.handledRequests;
    const payload = JSON.parse(request.requestBody);

    assert.notOk(controller.get('isShowingModal'));
    assert.deepEqual(payload, {
      pipelineId: '1234',
      startFrom: '~commit'
    });
  });
});
