import { resolve } from 'rsvp';
import EmberObject from '@ember/object';
import { run } from '@ember/runloop';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { settled } from '@ember/test-helpers';
import Pretender from 'pretender';
import Service from '@ember/service';
import sinon from 'sinon';
import sinonTest from 'ember-sinon-qunit/test-support/test';

const invalidateStub = sinon.stub();

const prEventsService = Service.extend({
  getPrEvents() {
    return resolve();
  }
});

const sessionServiceMock = Service.extend({
  isAuthenticated: true,
  invalidate: invalidateStub,
  data: {
    authenticated: {
      // fake token for test, it has { username: apple } inside
      // eslint-disable-next-line max-len
      token:
        'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VybmFtZSI6ImFwcGxlIiwianRpIjoiNTA1NTQzYTUtNDhjZi00OTAyLWE3YTktZGY0NTI1ODFjYWM0IiwiaWF0IjoxNTIxNTcyMDE5LCJleHAiOjE1MjE1NzU2MTl9.ImS1ajOnksl1X74uL85jOjzdUXmBW3HfMdPfP1vjrmc'
    }
  }
});

const routerServiceMock = Service.extend({
  currentRoute: {
    name: 'someRouteName'
  }
});
let server;

module('Unit | Controller | pipeline/build', function(hooks) {
  setupTest(hooks);

  hooks.beforeEach(function() {
    server = new Pretender();
    this.owner.register('service:session', sessionServiceMock);
    this.owner.register('service:pr-events', prEventsService);
  });

  hooks.afterEach(function() {
    server.shutdown();
    invalidateStub.reset();
  });

  test('it exists', function(assert) {
    assert.ok(this.owner.lookup('controller:pipeline/build'));
  });

  test('it restarts a build', async function(assert) {
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

    const controller = this.owner.lookup('controller:pipeline/build');

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

    await settled();

    const [request] = server.handledRequests;
    const payload = JSON.parse(request.requestBody);

    assert.deepEqual(payload, {
      buildId: 123,
      causeMessage: 'Manually started by apple'
    });
  });

  test('it fails to restart a build', async function(assert) {
    assert.expect(6);

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

    const controller = this.owner.lookup('controller:pipeline/build');

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

    await settled();

    const [request] = server.handledRequests;
    const payload = JSON.parse(request.requestBody);

    assert.deepEqual(payload, {
      buildId: 123,
      causeMessage: 'Manually started by apple'
    });
    assert.notOk(controller.get('isShowingModal'));
    assert.ok(invalidateStub.called);
    assert.deepEqual(controller.get('errorMessage'), 'User does not have permission');
  });

  test('it stops a build', async function(assert) {
    assert.expect(2);
    server.put('http://localhost:8080/v4/builds/5678', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify({
        id: '5678',
        status: 'ABORTED'
      })
    ]);

    const controller = this.owner.lookup('controller:pipeline/build');

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

    await settled();

    const [request] = server.handledRequests;
    const payload = JSON.parse(request.requestBody);

    assert.deepEqual(payload, {
      status: 'ABORTED'
    });
    assert.deepEqual(controller.get('errorMessage'), '');
  });

  test('it fails to stop a build', async function(assert) {
    assert.expect(3);
    server.put('http://localhost:8080/v4/builds/5678', () => [
      401,
      {},
      JSON.stringify({
        statusCode: 401,
        error: 'unauthorized',
        message: 'User does not have permission'
      })
    ]);

    const controller = this.owner.lookup('controller:pipeline/build');

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

    await settled();

    const [request] = server.handledRequests;
    const payload = JSON.parse(request.requestBody);

    assert.deepEqual(payload, {
      status: 'ABORTED'
    });
    assert.ok(invalidateStub.called);
    assert.deepEqual(controller.get('errorMessage'), 'User does not have permission');
  });

  test('it reloads a build', async function(assert) {
    assert.expect(4);
    const controller = this.owner.lookup('controller:pipeline/build');
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
      hasMany: key => {
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

    await settled();

    assert.ok(true);
  });

  sinonTest('it will not change build step in pipeline.events', function(assert) {
    assert.expect(1);
    this.owner.unregister('service:router');
    this.owner.register('service:router', routerServiceMock);
    const routerService = this.owner.lookup('service:router');

    routerService.set('currentRoute', { name: 'pipeline.events' });

    const controller = this.owner.lookup('controller:pipeline/build');
    const spy = this.spy(controller, 'transitionToRoute');

    controller.changeBuildStep();
    assert.ok(spy.notCalled, 'transition was not called');
    this.owner.unregister('service:router');
  });

  sinonTest('it changes build step in pipeline.build.step', function(assert) {
    assert.expect(3);
    this.owner.unregister('service:router');
    this.owner.register('service:router', routerServiceMock);
    const routerService = this.owner.lookup('service:router');

    routerService.set('currentRoute', { name: 'pipeline.build.step' });

    const controller = this.owner.lookup('controller:pipeline/build');
    const stub = this.stub(controller, 'transitionToRoute');
    const build = EmberObject.create({
      id: 5678,
      jobId: 'abcd',
      status: 'RUNNING',
      steps: [{ startTime: 's', name: 'active' }]
    });

    const pipeline = EmberObject.create({
      id: 1
    });

    controller.set('model', {
      build,
      pipeline
    });

    controller.changeBuildStep();

    assert.ok(true);
    assert.ok(stub.calledOnce, 'transition was called once');
    assert.ok(
      stub.calledWithExactly('pipeline.build.step', 1, 5678, 'active'),
      'transition to build step page'
    );
    this.owner.unregister('service:router');
  });
});
