import { resolve } from 'rsvp';
import EmberObject from '@ember/object';
import { run } from '@ember/runloop';
import { moduleFor, test } from 'ember-qunit';
import Pretender from 'pretender';
import Service from '@ember/service';
import wait from 'ember-test-helpers/wait';

const prEventsService = Service.extend({
  getPrEvents() {
    return resolve();
  }
});

const sessionServiceMock = Service.extend({
  isAuthenticated: true,
  data: {
    authenticated: {
      // fake token for test, it has { username: apple } inside
      // eslint-disable-next-line max-len
      token: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VybmFtZSI6ImFwcGxlIiwianRpIjoiNTA1NTQzYTUtNDhjZi00OTAyLWE3YTktZGY0NTI1ODFjYWM0IiwiaWF0IjoxNTIxNTcyMDE5LCJleHAiOjE1MjE1NzU2MTl9.ImS1ajOnksl1X74uL85jOjzdUXmBW3HfMdPfP1vjrmc'
    }
  }
});
let server;

moduleFor('controller:pipeline/build', 'Unit | Controller | pipeline/build', {
  // Specify the other units that are required for this test.
  // eslint-disable-next-line max-len
  needs: ['model:build', 'model:event', 'adapter:application', 'service:session', 'serializer:build', 'serializer:event'],
  beforeEach() {
    server = new Pretender();
    this.register('service:session', sessionServiceMock);
    this.register('service:pr-events', prEventsService);
  },
  afterEach() {
    server.shutdown();
  }
});

test('it exists', function (assert) {
  let controller = this.subject();

  assert.ok(controller);
});

test('it restarts a build', function (assert) {
  assert.expect(5);

  server.post('http://localhost:8080/v4/events', () => [
    201,
    { 'Content-Type': 'application/json' },
    JSON.stringify({
      id: '5678'
    })
  ]);
  server.get('http://localhost:8080/v4/events/5678/builds', () => [
    200,
    { 'Content-Type': 'application/json' },
    JSON.stringify([{ id: '9999' }])
  ]);

  let controller = this.subject();

  run(() => {
    controller.set('model', {
      build: EmberObject.create({
        id: '123'
      }),
      job: EmberObject.create({
        name: 'PR-1:main'
      }),
      event: EmberObject.create({
        id: '1',
        sha: 'sha'
      })
    });

    assert.notOk(controller.get('isShowingModal'));
    controller.transitionToRoute = (path, id) => {
      assert.equal(path, 'pipeline.build');
      assert.equal(id, 9999);
    };
    controller.send('startBuild');
    assert.ok(controller.get('isShowingModal'));
  });

  return wait().then(() => {
    const [request] = server.handledRequests;
    const payload = JSON.parse(request.requestBody);

    assert.deepEqual(payload, {
      buildId: 123,
      causeMessage: 'apple clicked restart for job "PR-1:main" for sha sha'
    });
  });
});

test('it fails to restart a build', function (assert) {
  assert.expect(5);

  server.post('http://localhost:8080/v4/events', () => [
    401,
    {},
    JSON.stringify({
      statusCode: 401,
      error: 'unauthorized',
      message: 'User does not have permission'
    })
  ]);
  server.get('http://localhost:8080/v4/events/5678/builds', () => [
    200,
    { 'Content-Type': 'application/json' },
    JSON.stringify([{ id: '9999' }])
  ]);

  let controller = this.subject();

  run(() => {
    controller.set('model', {
      build: EmberObject.create({
        id: '123'
      }),
      job: EmberObject.create({
        name: 'PR-1:main'
      }),
      event: EmberObject.create({
        id: '1',
        sha: 'sha'
      })
    });

    assert.notOk(controller.get('isShowingModal'));
    controller.send('startBuild');
    assert.ok(controller.get('isShowingModal'));
  });

  return wait().then(() => {
    const [request] = server.handledRequests;
    const payload = JSON.parse(request.requestBody);

    assert.deepEqual(payload, {
      buildId: 123,
      causeMessage: 'apple clicked restart for job "PR-1:main" for sha sha'
    });
    assert.notOk(controller.get('isShowingModal'));
    assert.deepEqual(controller.get('errorMessage'), 'User does not have permission');
  });
});

test('it stops a build', function (assert) {
  assert.expect(2);
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
    controller.store.push({
      data: {
        id: '5678',
        type: 'build',
        attributes: {
          jobId: '123'
        }
      }
    });
    const build = controller.store.peekRecord('build', 5678);

    controller.set('model', { build });

    controller.send('stopBuild');
  });

  return wait().then(() => {
    const [request] = server.handledRequests;
    const payload = JSON.parse(request.requestBody);

    assert.deepEqual(payload, {
      status: 'ABORTED'
    });
    assert.deepEqual(controller.get('errorMessage'), '');
  });
});

test('it fails to stop a build', function (assert) {
  assert.expect(2);
  server.put('http://localhost:8080/v4/builds/5678', () => [
    401,
    {},
    JSON.stringify({
      statusCode: 401,
      error: 'unauthorized',
      message: 'User does not have permission'
    })
  ]);

  let controller = this.subject();

  run(() => {
    controller.store.push({
      data: {
        id: '5678',
        type: 'build',
        attributes: {
          jobId: '123'
        }
      }
    });
    const build = controller.store.peekRecord('build', 5678);

    controller.set('model', { build });

    controller.send('stopBuild');
  });

  return wait().then(() => {
    const [request] = server.handledRequests;
    const payload = JSON.parse(request.requestBody);

    assert.deepEqual(payload, {
      status: 'ABORTED'
    });
    assert.deepEqual(controller.get('errorMessage'), 'User does not have permission');
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
