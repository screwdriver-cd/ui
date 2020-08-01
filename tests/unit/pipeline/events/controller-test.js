import EmberObject from '@ember/object';
import { A as newArray } from '@ember/array';
import { run } from '@ember/runloop';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { settled } from '@ember/test-helpers';
import Pretender from 'pretender';
import Service from '@ember/service';
import sinon from 'sinon';
import ENV from 'screwdriver-ui/config/environment';

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

module('Unit | Controller | pipeline/events', function(hooks) {
  setupTest(hooks);

  hooks.beforeEach(function() {
    server = new Pretender();
    this.owner.register('service:session', sessionServiceMock);
  });

  hooks.afterEach(function() {
    server.shutdown();
  });

  test('it exists', function(assert) {
    assert.ok(this.owner.lookup('controller:pipeline/events'));
  });

  test('it starts a build', async function(assert) {
    assert.expect(9);
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

      controller.set('listViewOffset', 3);
      controller.set('getNewListViewJobs', (listViewOffset, listViewCutOff) => {
        assert.equal(listViewOffset, 0);
        assert.equal(listViewCutOff, 3);

        return Promise.resolve([]);
      });

      controller.set('reload', () => {
        assert.ok(true);

        return Promise.resolve({});
      });

      controller.set('model', {
        events: EmberObject.create({})
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

  test('it starts a single build', async function(assert) {
    assert.expect(13);
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

      controller.set('listViewOffset', 3);
      controller.set('getNewListViewJobs', (listViewOffset, listViewCutOff) => {
        assert.equal(listViewOffset, 0);
        assert.equal(listViewCutOff, 3);

        return Promise.resolve([]);
      });

      controller.set('reload', () => {
        assert.ok(true);

        return Promise.resolve({});
      });

      controller.set('model', {
        events: EmberObject.create({})
      });

      controller.transitionToRoute = (path, id) => {
        assert.equal(path, 'pipeline');
        assert.equal(id, 1234);
      };

      controller.set('store.queryRecord', (modelName, params) => {
        assert.equal(modelName, 'build');
        assert.deepEqual(params, {
          jobId: 1
        });

        return Promise.resolve(EmberObject.create({ eventId: '10', parentBuildId: '57' }));
      });

      controller.set('store.findRecord', (modelName, params) => {
        assert.equal(modelName, 'event');
        assert.deepEqual(params, '10');

        return Promise.resolve(EmberObject.create({ id: '10' }));
      });

      assert.notOk(controller.get('isShowingModal'));
      controller.send('startSingleBuild', 1, 'name', 'RESTART');
      assert.ok(controller.get('isShowingModal'));
    });

    await settled();

    const [request] = server.handledRequests;
    const payload = JSON.parse(request.requestBody);

    assert.notOk(controller.get('isShowingModal'));
    assert.deepEqual(payload, {
      pipelineId: '1234',
      startFrom: 'name',
      parentBuildId: 57,
      parentEventId: 10,
      causeMessage: 'Manually started by apple'
    });
  });

  test('it restarts a build', async function(assert) {
    assert.expect(8);
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

      controller.set('listViewOffset', 6);
      controller.set('getNewListViewJobs', (listViewOffset, listViewCutOff) => {
        assert.equal(listViewOffset, 0);
        assert.equal(listViewCutOff, 6);

        return Promise.resolve([]);
      });

      controller.set('reload', () => {
        assert.ok(true);

        return Promise.resolve({});
      });

      controller.set('model', {
        events: EmberObject.create({})
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

  test('it restarts a PR build', async function(assert) {
    assert.expect(8);
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

      controller.set('listViewOffset', 5);
      controller.set('getNewListViewJobs', (listViewOffset, listViewCutOff) => {
        assert.equal(listViewOffset, 0);
        assert.equal(listViewCutOff, 5);

        return Promise.resolve([]);
      });

      controller.set('reload', () => {
        assert.ok(true);

        return Promise.resolve({});
      });

      controller.set('model', {
        events: EmberObject.create({})
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

  test('it stops a build', async function(assert) {
    assert.expect(5);
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
        events: EmberObject.create({})
      });

      controller.set('listViewOffset', 3);
      controller.set('getNewListViewJobs', (listViewOffset, listViewCutOff) => {
        assert.equal(listViewOffset, 0);
        assert.equal(listViewCutOff, 3);

        return Promise.resolve([]);
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

  test('it stops PR build(s)', async function(assert) {
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

    const jobs = EmberObject.create([
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
        events: EmberObject.create({})
      });

      const build = controller.store.peekRecord('build', '123');

      build.set('status', 'ABORTED');
      build.save();

      controller.send('stopPRBuilds', jobs);
    });

    await settled();

    const [request] = server.handledRequests;
    const payload = JSON.parse(request.requestBody);

    assert.deepEqual(payload, {
      status: 'ABORTED'
    });
  });

  test('it starts PR build(s)', async function(assert) {
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
        events: EmberObject.create({})
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

  test('New event comes top of PR list when it starts a PR build with prChain', async function(assert) {
    const prNum = 3;
    const jobs = [{ hasMany: () => ({ reload: () => assert.ok(true) }) }];

    assert.expect(7);

    server.post('http://localhost:8080/v4/events', () => [
      201,
      { 'Content-Type': 'application/json' },
      JSON.stringify({
        id: '2'
      })
    ]);

    const createRecordStub = sinon.stub();
    const controller = this.owner.factoryFor('controller:pipeline/events').create({
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

      controller.set('listViewOffset', 3);
      controller.set('getNewListViewJobs', (listViewOffset, listViewCutOff) => {
        assert.equal(listViewOffset, 0);
        assert.equal(listViewCutOff, 3);

        return Promise.resolve([]);
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
        events: EmberObject.create({})
      });

      assert.notOk(controller.get('isShowingModal'));
      controller.send('startPRBuild', prNum, jobs);
      assert.ok(controller.get('isShowingModal'));
    });

    await settled();

    assert.equal(controller.get('prEvents')[0].id, 3);
    assert.equal(controller.get('prEvents')[0].prNum, '3');
  });

  test('it refreshListViewJobs', async function(assert) {
    assert.expect(3);
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
          id: '1234',
          jobs: [
            EmberObject.create({ id: '1', name: 'a', pipelineId: '1234' }),
            EmberObject.create({ id: '2', name: 'b', pipelineId: '1234' }),
            EmberObject.create({ id: '3', name: 'c', pipelineId: '1234' }),
            EmberObject.create({ id: '4', name: 'd', pipelineId: '1234' })
          ]
        })
      );

      controller.set('listViewOffset', 3);

      controller.set('store.query', (modelName, params) => {
        assert.equal(modelName, 'build-history');
        assert.deepEqual(params, {
          jobIds: ['1', '2', '3'],
          offset: 0,
          numBuilds: ENV.APP.NUM_BUILDS_LISTED
        });

        return Promise.resolve([{ jobId: 1 }, { jobId: 2 }, { jobId: 3 }]);
      });

      controller.send('refreshListViewJobs');
    });

    await settled();

    assert.deepEqual(controller.get('jobsDetails'), [
      { jobId: 1, jobName: 'a', jobPipelineId: '1234' },
      { jobId: 2, jobName: 'b', jobPipelineId: '1234' },
      { jobId: 3, jobName: 'c', jobPipelineId: '1234' }
    ]);
  });

  test('it updateListViewJobs purge', async function(assert) {
    assert.expect(3);
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
          id: '1234',
          jobs: [
            EmberObject.create({ id: '1', name: 'a', pipelineId: '1234' }),
            EmberObject.create({ id: '2', name: 'b', pipelineId: '1234' }),
            EmberObject.create({ id: '3', name: 'c', pipelineId: '1234' }),
            EmberObject.create({ id: '4', name: 'd', pipelineId: '1234' })
          ]
        })
      );

      controller.set('jobsDetails', [
        EmberObject.create({ jobId: 7, jobName: 'purge', jobPipelineId: '12' })
      ]);

      controller.set('listViewOffset', 3);

      controller.set('store.query', (modelName, params) => {
        assert.equal(modelName, 'build-history');
        assert.deepEqual(params, {
          jobIds: ['1', '2', '3', '4'],
          offset: 0,
          numBuilds: ENV.APP.NUM_BUILDS_LISTED
        });

        return Promise.resolve([{ jobId: 1 }, { jobId: 2 }, { jobId: 3 }, { jobId: 4 }]);
      });

      controller.send('updateListViewJobs');
    });

    await settled();

    assert.deepEqual(controller.get('jobsDetails'), [
      { jobId: 1, jobName: 'a', jobPipelineId: '1234' },
      { jobId: 2, jobName: 'b', jobPipelineId: '1234' },
      { jobId: 3, jobName: 'c', jobPipelineId: '1234' },
      { jobId: 4, jobName: 'd', jobPipelineId: '1234' }
    ]);
  });

  test('it setShowListView reset listViewOffset and jobsDetails', async function(assert) {
    assert.expect(4);

    const controller = this.owner.lookup('controller:pipeline/events');
    const listViewOffset = 10;
    const dummyJob = {};
    const jobsDetails = [dummyJob, dummyJob, dummyJob];

    run(() => {
      controller.setProperties({
        listViewOffset,
        jobsDetails
      });

      assert.equal(
        controller.get('listViewOffset'),
        listViewOffset,
        `has listViewOffset of ${listViewOffset}`
      );
      assert.equal(controller.get('jobsDetails').length, 3, 'has 3 jobs');

      controller.send('setShowListView', false);
      assert.equal(controller.get('listViewOffset'), 0, `has listViewOffset of 0`);
      assert.equal(controller.get('jobsDetails').length, 0, 'has 0 jobs');
    });
  });
});
