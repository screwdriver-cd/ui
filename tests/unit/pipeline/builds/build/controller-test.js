import { moduleFor, test } from 'ember-qunit';
import Pretender from 'pretender';
import Ember from 'ember';
import wait from 'ember-test-helpers/wait';
let server;

moduleFor('controller:pipeline/builds/build', 'Unit | Controller | pipeline/builds/build', {
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
  assert.expect(3);
  server.post('http://localhost:8080/v4/builds', () => [
    200,
    { 'Content-Type': 'application/json' },
    JSON.stringify({
      id: '5678',
      status: 'QUEUED'
    })
  ]);

  let controller = this.subject();

  Ember.run(() => {
    controller.set('model', {
      build: Ember.Object.create({
        jobId: 'abcd'
      })
    });
    controller.transitionToRoute = (path, id) => {
      assert.equal(path, 'pipeline.builds.build');
      assert.equal(id, 5678);
    };

    controller.send('startBuild');
  });

  return wait().then(() => {
    const [request] = server.handledRequests;
    const payload = JSON.parse(request.requestBody);

    assert.deepEqual(payload, {
      jobId: 'abcd'
    });
  });
});

test('it stops a build', function (assert) {
  assert.expect(1);
  server.put('http://localhost:8080/v4/builds/5678', () => [
    200,
    { 'Content-Type': 'application/json' },
    JSON.stringify({
      id: '5678',
      status: 'ABORTED'
    })
  ]);

  let controller = this.subject();

  Ember.run(() => {
    controller.set('model', {
      build: Ember.Object.create({
        jobId: 'abcd',
        save() {
          assert.ok(true);
        }
      })
    });

    controller.send('stopBuild');
  });
});
