import { resolve } from 'rsvp';
import EmberObject from '@ember/object';
import { run } from '@ember/runloop';
import { moduleFor, test } from 'ember-qunit';
import Pretender from 'pretender';
import wait from 'ember-test-helpers/wait';
let server;

moduleFor('controller:pipeline/builds/build', 'Unit | Controller | pipeline/builds/build', {
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
  assert.expect(3);
  server.post('http://localhost:8080/v4/events', () => [
    201,
    { 'Content-Type': 'application/json' },
    JSON.stringify({ id: '5678' })
  ]);
  server.get('http://localhost:8080/v4/events/5678/builds', () => [
    200,
    { 'Content-Type': 'application/json' },
    JSON.stringify([{ id: '9999' }])
  ]);

  let controller = this.subject();

  run(() => {
    controller.set('model', {
      pipeline: EmberObject.create({
        id: '1234'
      }),
      job: EmberObject.create({
        name: 'PR-1:main'
      })
    });
    controller.transitionToRoute = (path, id) => {
      assert.equal(path, 'pipeline.builds.build');
      assert.equal(id, 9999);
    };

    controller.send('startBuild');
  });

  return wait().then(() => {
    const [request] = server.handledRequests;
    const payload = JSON.parse(request.requestBody);

    assert.deepEqual(payload, {
      pipelineId: '1234',
      startFrom: 'PR-1:main'
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

  run(() => {
    controller.set('model', {
      build: EmberObject.create({
        jobId: 'abcd',
        save() {
          assert.ok(true);
        }
      })
    });

    controller.send('stopBuild');
  });
});

test('it reloads a build', function (assert) {
  assert.expect(4);
  let controller = this.subject();
  const build = EmberObject.create({
    id: '5678',
    jobId: 'abcd',
    status: 'QUEUED',
    reload() {
      assert.ok(true);
      this.set('status', 'SUCCESS');

      return resolve({
        id: '5678',
        jobId: 'abcd',
        status: 'SUCCESS'
      });
    }
  });

  const event = EmberObject.create({
    hasMany: (key) => {
      assert.equal(key, 'builds');

      return {
        reload: () => assert.ok(true)
      };
    }
  });

  run(() => {
    controller.set('model', {
      build,
      event
    });

    controller.reloadBuild();
  });

  return wait().then(() => {
    assert.ok(true);
  });
});
