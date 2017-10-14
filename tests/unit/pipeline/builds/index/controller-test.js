import EmberObject from '@ember/object';
import { A } from '@ember/array';
import { run } from '@ember/runloop';
import { moduleFor, test } from 'ember-qunit';
import Pretender from 'pretender';
import wait from 'ember-test-helpers/wait';
let server;

moduleFor('controller:pipeline/builds/index', 'Unit | Controller | pipeline/builds/index', {
  // Specify the other units that are required for this test.
  needs: ['model:build', 'adapter:application', 'service:session', 'serializer:build'],
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
  assert.expect(6);
  server.post('http://localhost:8080/v4/builds', () => [
    200,
    { 'Content-Type': 'application/json' },
    JSON.stringify({
      id: '5678',
      status: 'QUEUED'
    })
  ]);

  let controller = this.subject();

  run(() => {
    controller.set('model', {
      // eslint-disable-next-line new-cap
      jobs: A([
        EmberObject.create({
          id: 'abcd',
          name: 'main',
          // eslint-disable-next-line new-cap
          builds: A([
            EmberObject.create({
              id: '1234',
              jobId: 'abcd',
              status: 'FAILURE'
            })
          ])
        })
      ])
    });

    controller.transitionToRoute = (path, id) => {
      assert.equal(path, 'pipeline.builds.build');
      assert.equal(id, 5678);
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
      jobId: 'abcd'
    });
  });
});

test('it transistions to running build', function (assert) {
  assert.expect(2);
  let controller = this.subject();

  run(() => {
    controller.set('model', {
      // eslint-disable-next-line new-cap
      jobs: A([
        EmberObject.create({
          id: 'abcd',
          name: 'main',
          // eslint-disable-next-line new-cap
          builds: A([
            EmberObject.create({
              id: '1234',
              jobId: 'abcd',
              status: 'RUNNING'
            })
          ])
        })
      ])
    });

    controller.transitionToRoute = (path, id) => {
      assert.equal(path, 'pipeline.builds.build');
      assert.equal(id, 1234);
    };

    controller.send('startMainBuild');
  });
});
