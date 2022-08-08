import EmberObject from '@ember/object';
import { A as newArray } from '@ember/array';
import { run } from '@ember/runloop';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { settled } from '@ember/test-helpers';
import Pretender from 'pretender';
import Service from '@ember/service';
import sinon from 'sinon';

const sessionServiceMock = Service.extend({
  isAuthenticated: true,
  data: {
    authenticated: {
      // fake token for test, it has { username: apple } inside
      // eslint-disable-next-line max-len
      token:
        'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VybmFtZSI6ImFwcGxlIiwianRpIjoiNTA1NTQzYTUtNDhjZi00OTAyLWE3YTktZGY0NTI1ODFjYWM0IiwiaWF0IjoxNTIxNTcyMDE5LCJleHAiOjE1MjE1NzU2MTl9.ImS1ajOnksl1X74uL85jOjzdUXmBW3HfMdPfP1vjrmc'
    }
  }
});

let server;

module('Unit | Controller | pipeline/events', function (hooks) {
  setupTest(hooks);

  hooks.beforeEach(function () {
    server = new Pretender();
    this.owner.register('service:session', sessionServiceMock);
  });

  hooks.afterEach(function () {
    server.shutdown();
  });

  test('it exists', function (assert) {
    assert.ok(this.owner.lookup('controller:pipeline/events'));
  });

  test('it starts a build', async function (assert) {
    assert.expect(7);
    server.get('http://localhost:8080/v4/events/5678/builds', () => [
      201,
      { 'Content-Type': 'application/json' },
      JSON.stringify([{ id: '1234' }])
    ]);
    server.post('http://localhost:8080/v4/events', () => [
      201,
      { 'Content-Type': 'application/json' },
      JSON.stringify({
        id: '5678',
        pipelineId: '1234'
      })
    ]);

    const controller = this.owner.lookup('controller:pipeline/events');

    run(() => {
      controller.set(
        'pipeline',
        EmberObject.create({
          id: '1234'
        })
      );

      controller.set('reload', () => {
        assert.ok(true);

        return Promise.resolve({});
      });

      controller.set('model', {
        events: newArray()
      });

      controller.transitionToRoute = (path, id) => {
        assert.equal(path, 'pipeline');
        assert.equal(id, 1234);
      };

      assert.notOk(controller.get('isShowingModal'));
      controller.send('startMainBuild');
      assert.ok(controller.get('isShowingModal'));
    });

    await settled();

    const [request] = server.handledRequests;
    const payload = JSON.parse(request.requestBody);

    assert.notOk(controller.get('isShowingModal'));
    assert.deepEqual(payload, {
      pipelineId: '1234',
      startFrom: '~commit',
      causeMessage: 'Manually started by apple'
    });
  });

  test('it restarts a build', async function (assert) {
    assert.expect(6);
    server.get('http://localhost:8080/v4/events/2/builds', () => [
      201,
      { 'Content-Type': 'application/json' },
      JSON.stringify([{ id: '1234' }])
    ]);
    server.post('http://localhost:8080/v4/events', () => [
      201,
      { 'Content-Type': 'application/json' },
      JSON.stringify({
        id: '2'
      })
    ]);

    const controller = this.owner.lookup('controller:pipeline/events');

    run(() => {
      controller.store.push({
        data: {
          id: '123',
          type: 'build',
          attributes: {
            parentBuildId: '345'
          }
        }
      });
      controller.set('selectedEventObj', {
        id: '1',
        sha: 'sha'
      });

      controller.set(
        'pipeline',
        EmberObject.create({
          id: '1234'
        })
      );

      controller.set('reload', () => {
        assert.ok(true);

        return Promise.resolve({});
      });

      controller.set('model', {
        events: newArray()
      });

      controller.transitionToRoute = path => {
        assert.equal(path, 'pipeline/1234/events');
      };

      assert.notOk(controller.get('isShowingModal'));
      controller.send('startDetachedBuild', { buildId: '123', name: 'deploy' });
      assert.ok(controller.get('isShowingModal'));
    });

    await settled();

    const [request] = server.handledRequests;
    const payload = JSON.parse(request.requestBody);

    assert.notOk(controller.get('isShowingModal'));
    assert.deepEqual(payload, {
      pipelineId: '1234',
      startFrom: 'deploy',
      buildId: 123,
      parentBuildId: 345,
      parentEventId: 1,
      causeMessage: 'Manually started by apple'
    });
  });

  test('it restarts a PR build', async function (assert) {
    assert.expect(6);
    server.get('http://localhost:8080/v4/events/2/builds', () => [
      201,
      { 'Content-Type': 'application/json' },
      JSON.stringify([{ id: '1234' }])
    ]);
    server.post('http://localhost:8080/v4/events', () => [
      201,
      { 'Content-Type': 'application/json' },
      JSON.stringify({
        id: '2'
      })
    ]);

    const controller = this.owner.lookup('controller:pipeline/events');

    run(() => {
      controller.store.push({
        data: {
          id: '123',
          type: 'build',
          attributes: {
            parentBuildId: '345'
          }
        }
      });
      controller.set('selectedEventObj', {
        id: '1',
        sha: 'sha',
        prNum: '3'
      });

      controller.set(
        'pipeline',
        EmberObject.create({
          id: '1234'
        })
      );

      controller.set('activeTab', 'pulls');

      controller.set('reload', () => {
        assert.ok(true);

        return Promise.resolve({});
      });

      controller.set('model', {
        events: newArray()
      });

      controller.transitionToRoute = path => {
        assert.equal(path, 'pipeline/1234/pulls');
      };

      assert.notOk(controller.get('isShowingModal'));
      controller.send('startDetachedBuild', { buildId: '123', name: 'deploy' });
      assert.ok(controller.get('isShowingModal'));
    });

    await settled();

    const [request] = server.handledRequests;
    const payload = JSON.parse(request.requestBody);

    assert.notOk(controller.get('isShowingModal'));
    assert.deepEqual(payload, {
      pipelineId: '1234',
      startFrom: 'PR-3:deploy',
      buildId: 123,
      parentBuildId: 345,
      parentEventId: 1,
      causeMessage: 'Manually started by apple'
    });
  });

  test('it stops a build', async function (assert) {
    assert.expect(3);
    server.put('http://localhost:8080/v4/builds/123', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify({
        id: '123'
      })
    ]);

    const controller = this.owner.lookup('controller:pipeline/events');

    const job = {
      buildId: '123',
      name: 'deploy'
    };

    const event = {
      hasMany: () => ({ reload: () => assert.ok(true) }),
      id: '123'
    };

    run(() => {
      controller.store.push({
        data: {
          id: '123',
          type: 'build',
          attributes: {
            status: 'RUNNING'
          }
        }
      });

      controller.set('model', {
        events: newArray()
      });

      const build = controller.store.peekRecord('build', '123');

      build.set('status', 'ABORTED');
      build.save();

      controller.send('stopBuild', event, job);
    });

    await settled();

    const [request] = server.handledRequests;
    const payload = JSON.parse(request.requestBody);

    assert.notOk(controller.get('isShowingModal'));
    assert.deepEqual(payload, {
      status: 'ABORTED'
    });
  });

  test('it stops PR build(s)', async function (assert) {
    assert.expect(1);
    server.put('http://localhost:8080/v4/builds/123', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify({
        id: '123'
      })
    ]);
    server.put('http://localhost:8080/v4/events/123/stop', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify({
        id: '123'
      })
    ]);

    const controller = this.owner.lookup('controller:pipeline/events');

    const jobs = newArray([
      {
        builds: [
          {
            eventId: 123
          }
        ]
      }
    ]);

    run(() => {
      controller.store.push({
        data: {
          id: '123',
          type: 'build',
          attributes: {
            status: 'RUNNING'
          }
        }
      });

      controller.set('model', {
        events: newArray()
      });

      const build = controller.store.peekRecord('build', '123');

      build.set('status', 'ABORTED');
      build.save();

      controller.send('stopPRBuilds', jobs);
    });

    await settled();

    const [request] = server.handledRequests;
    const { responseText } = request;
    const payload = JSON.parse(responseText);

    assert.deepEqual(payload, {
      id: '123'
    });
  });

  test('it starts PR build(s)', async function (assert) {
    const prNum = 999;

    assert.expect(5);
    server.post('http://localhost:8080/v4/events', () => [
      201,
      { 'Content-Type': 'application/json' },
      JSON.stringify({
        id: '5679',
        pipelineId: '1234'
      })
    ]);

    const controller = this.owner.lookup('controller:pipeline/events');

    const jobs = [{ hasMany: () => ({ reload: () => assert.ok(true) }) }];

    run(() => {
      controller.set(
        'pipeline',
        EmberObject.create({
          id: '1234'
        })
      );

      controller.set('model', {
        events: newArray()
      });

      assert.notOk(controller.get('isShowingModal'));
      controller.send('startPRBuild', prNum, jobs);
      assert.ok(controller.get('isShowingModal'));
    });

    await settled();

    const [request] = server.handledRequests;
    const payload = JSON.parse(request.requestBody);

    assert.notOk(controller.get('isShowingModal'));
    assert.deepEqual(payload, {
      causeMessage: 'Manually started by apple',
      pipelineId: '1234',
      startFrom: '~pr',
      prNum
    });
  });

  test('New event comes top of PR list when it starts a PR build with prChain', async function (assert) {
    const prNum = 3;
    const jobs = [{ hasMany: () => ({ reload: () => assert.ok(true) }) }];

    assert.expect(5);

    server.post('http://localhost:8080/v4/events', () => [
      201,
      { 'Content-Type': 'application/json' },
      JSON.stringify({
        id: '2'
      })
    ]);

    const createRecordStub = sinon.stub();
    const controller = this.owner
      .factoryFor('controller:pipeline/events')
      .create({
        store: {
          createRecord: createRecordStub
        }
      });

    const newEvent = EmberObject.create({
      id: 3,
      prNum: '3',
      sha: 'sha1',
      save: () => Promise.resolve(),
      get: () => Promise.resolve()
    });

    createRecordStub.returns(newEvent);

    run(() => {
      const event1 = EmberObject.create({
        id: '1',
        prNum: '2',
        sha: 'sha1'
      });
      const event2 = EmberObject.create({
        id: '2',
        prNum: '3',
        sha: 'sha2'
      });

      controller.set('prEvents', newArray([event1, event2]));

      controller.set(
        'pipeline',
        EmberObject.create({
          id: '1234',
          prChain: true
        })
      );

      controller.set('model', {
        events: newArray()
      });

      assert.notOk(controller.get('isShowingModal'));
      controller.send('startPRBuild', prNum, jobs);
      assert.ok(controller.get('isShowingModal'));
    });

    await settled();

    assert.equal(controller.get('prEvents')[0].id, 3);
    assert.equal(controller.get('prEvents')[0].prNum, '3');
  });

  test('From no admins to have admins after sync', async function (assert) {
    assert.expect(4);

    const pipelineData = {
      id: 1234,
      name: 'adong/fp-www',
      scmUri: 'git.example.com:488454:adong/x',
      scmContext: 'github:git.example.com',
      scmRepo: {
        branch: 'adong/x',
        name: 'adong/fp-www',
        url: 'https://git.example.com/adong/fp-www/tree/adong/x',
        rootDir: '',
        private: false
      },
      createTime: '2021-03-30T17:08:32.581Z',
      admins: {},
      workflowGraph: {
        nodes: [
          { name: '~pr' },
          { name: '~commit' },
          { name: 'pull-request1', id: 2071771 },
          { name: 'pull-request2', id: 2071772 },
          { name: 'component', id: 2071773 }
        ],
        edges: [
          { src: '~pr', dest: 'pull-request1' },
          { src: '~pr', dest: 'pull-request2' },
          { src: 'pull-request2', dest: 'component' }
        ]
      },
      annotations: { 'screwdriver.cd/buildCluster': 'gq1' },
      lastEventId: 14412878,
      prChain: false,
      parameters: {},
      subscribedScmUrlsWithActions: []
    };
    const adminsData = { adong: true };

    server.get('http://localhost:8080/v4/pipelines/1234', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify(pipelineData)
    ]);

    server.post('http://localhost:8080/v4/pipelines/1234/sync/', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify({})
    ]);

    const controller = this.owner.lookup('controller:pipeline/events');
    const pipeline = await controller.store.findRecord('pipeline', 1234);

    controller.set('pipeline', pipeline);

    assert.notOk(controller.get('hasAdmins'), 'has no admins');
    assert.deepEqual(
      controller.get('pipeline.admins'),
      {},
      'pipeline admins is empty'
    );

    run(() => {
      // add admins data
      server.get('http://localhost:8080/v4/pipelines/1234', () => [
        200,
        { 'Content-Type': 'application/json' },
        JSON.stringify({ ...pipelineData, admins: adminsData })
      ]);

      controller.send('syncAdmins');
    });

    await settled();

    assert.ok(controller.get('hasAdmins'), 'now has admins');
    assert.deepEqual(
      controller.get('pipeline.admins'),
      adminsData,
      'pipeline admins is NOT empty'
    );
  });

  test('it handles job enabling', async function (assert) {
    server.put('http://localhost:8080/v4/jobs/1234', () => [
      200,
      {},
      JSON.stringify({})
    ]);

    const controller = this.owner.lookup('controller:pipeline/events');

    run(() => {
      controller.store.push({
        data: {
          id: '1234',
          type: 'job',
          attributes: {
            state: 'DISABLED',
            stateChangeMessage: 'foo'
          }
        }
      });

      controller.send('setJobState', 1234, 'ENABLED', 'testing');
    });

    await settled();

    const job = await controller.store.peekRecord('job', 1234);
    const [request] = server.handledRequests;
    const payload = JSON.parse(request.requestBody);

    assert.equal(job.state, 'ENABLED');
    assert.equal(job.stateChangeMessage, 'testing');
    assert.equal(payload.state, 'ENABLED');
    assert.equal(payload.stateChangeMessage, 'testing');
  });

  test('it handles job disabling', async function (assert) {
    server.put('http://localhost:8080/v4/jobs/1234', () => [
      200,
      {},
      JSON.stringify({})
    ]);

    const controller = this.owner.lookup('controller:pipeline/events');

    run(() => {
      controller.store.push({
        data: {
          id: '1234',
          type: 'job',
          attributes: {
            state: 'ENABLED',
            stateChangeMessage: 'foo'
          }
        }
      });

      controller.send('setJobState', 1234, 'DISABLED', 'testing');
    });

    await settled();

    const job = await controller.store.peekRecord('job', 1234);
    const [request] = server.handledRequests;
    const payload = JSON.parse(request.requestBody);

    assert.equal(job.state, 'DISABLED');
    assert.equal(job.stateChangeMessage, 'testing');
    assert.equal(payload.state, 'DISABLED');
    assert.equal(payload.stateChangeMessage, 'testing');
  });

  test('it fails to handle job enabling', async function (assert) {
    server.put('http://localhost:8080/v4/jobs/1234', () => [
      403,
      {},
      JSON.stringify({
        statusCode: 403,
        error: 'Forbidden',
        message: 'Test Error'
      })
    ]);

    const controller = this.owner.lookup('controller:pipeline/events');

    run(() => {
      controller.store.push({
        data: {
          id: '1234',
          type: 'job',
          attributes: {
            state: 'DISABLED',
            stateChangeMessage: 'foo'
          }
        }
      });

      controller.send('setJobState', 1234, 'ENABLED', 'testing');
    });

    await settled();

    const job = await controller.store.peekRecord('job', 1234);
    const [request] = server.handledRequests;
    const payload = JSON.parse(request.requestBody);

    assert.equal(job.state, 'DISABLED');
    assert.equal(job.stateChangeMessage, 'foo');
    assert.equal(payload.state, 'ENABLED');
    assert.equal(payload.stateChangeMessage, 'testing');
    assert.equal(controller.get('errorMessage'), 'Test Error');
  });
});
