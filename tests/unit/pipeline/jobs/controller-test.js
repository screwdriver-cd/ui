import EmberObject from '@ember/object';
import { A as newArray } from '@ember/array';
import { run } from '@ember/runloop';
import { module, test } from 'qunit';
import { setupTest } from 'screwdriver-ui/tests/helpers';
import { settled, waitUntil } from '@ember/test-helpers';
import Pretender from 'pretender';
import Service from '@ember/service';
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

module('Unit | Controller | pipeline/jobs/index', function (hooks) {
  setupTest(hooks);

  hooks.beforeEach(function () {
    server = new Pretender();
    this.owner.register('service:session', sessionServiceMock);
  });

  hooks.afterEach(function () {
    server.shutdown();
  });

  test('it exists', function (assert) {
    assert.ok(this.owner.lookup('controller:pipeline/jobs/index'));
  });

  test('it starts a single build', async function (assert) {
    assert.expect(10);
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

    const controller = this.owner.lookup('controller:pipeline/jobs/index');

    const routerService = Service.extend({
      transitionTo: () => {
        assert.fail('we are not supposed to transitionTo for jobs.');
      }
    });

    this.owner.unregister('service:router');
    this.owner.register('service:router', routerService);

    run(() => {
      controller.set(
        'pipeline',
        EmberObject.create({
          id: '1234'
        })
      );

      controller.set('getNewListViewJobs', () => {
        assert.fail('we do not refresh the list view upon job start');
      });

      controller.set('reload', () => {
        assert.ok(true);

        return Promise.resolve({});
      });

      controller.set('model', {
        jobs: newArray()
      });

      controller.set('store.queryRecord', (modelName, params) => {
        assert.equal(modelName, 'build');
        assert.deepEqual(params, {
          jobId: 1
        });

        return Promise.resolve(
          EmberObject.create({ eventId: '10', parentBuildId: '57', id: '99' })
        );
      });

      controller.set('store.findRecord', (modelName, params) => {
        assert.equal(modelName, 'event');
        assert.deepEqual(params, '10');

        return Promise.resolve(EmberObject.create({ id: '10' }));
      });

      assert.notOk(controller.isShowingModal);
      controller.send('startSingleBuild', 1, 'name', 'RESTART');
      assert.ok(controller.isShowingModal);
    });

    await waitUntil(() => !controller.isShowingModal);

    const [request] = server.handledRequests;
    const payload = JSON.parse(request.requestBody);

    assert.notOk(controller.isShowingModal);
    assert.deepEqual(payload, {
      buildId: 99,
      pipelineId: '1234',
      startFrom: 'name',
      parentBuildId: 57,
      parentEventId: 10,
      causeMessage: 'Manually started by apple'
    });
  });

  test('it refreshListViewJobs', async function (assert) {
    assert.expect(7);
    server.post('http://localhost:8080/v4/events', () => [
      201,
      { 'Content-Type': 'application/json' },
      JSON.stringify({
        id: '5678',
        pipelineId: '1234'
      })
    ]);

    const controller = this.owner.lookup('controller:pipeline/jobs/index');

    run(() => {
      controller.set(
        'pipeline',
        EmberObject.create({
          id: '1234',
          jobs: [
            EmberObject.create({
              id: '1',
              name: 'a',
              pipelineId: '1234',
              annotations: {},
              stageName: 'production',
              virtualJob: false
            }),
            EmberObject.create({
              id: '2',
              name: 'b',
              pipelineId: '1234',
              annotations: {},
              stageName: 'N/A',
              virtualJob: false
            }),
            EmberObject.create({
              id: '3',
              name: 'c',
              pipelineId: '1234',
              annotations: {},
              stageName: 'N/A',
              virtualJob: false
            }),
            EmberObject.create({
              id: '4',
              name: 'd',
              pipelineId: '1234',
              annotations: {},
              stageName: 'N/A',
              virtualJob: false
            }),
            EmberObject.create({
              id: '5',
              name: 'v',
              pipelineId: '1234',
              annotations: {},
              stageName: 'N/A',
              virtualJob: true
            })
          ]
        })
      );

      controller.set('listViewOffset', 3);

      controller.set('store.query', (modelName, params) => {
        assert.equal(modelName, 'build-history');
        assert.deepEqual(params, {
          jobIds: params.jobIds,
          offset: 0,
          numBuilds: ENV.APP.NUM_BUILDS_LISTED
        });

        return Promise.resolve([{ jobId: params.jobIds }]);
      });

      controller.send('refreshListViewJobs');
    });

    await settled();

    assert.deepEqual(controller.jobsDetails, [
      {
        jobId: '1',
        jobName: 'a',
        jobPipelineId: '1234',
        annotations: {},
        prParentJobId: null,
        prNum: null,
        stageName: 'production',
        isVirtualJob: false
      },
      {
        jobId: '2',
        jobName: 'b',
        jobPipelineId: '1234',
        annotations: {},
        prParentJobId: null,
        prNum: null,
        stageName: 'N/A',
        isVirtualJob: false
      },
      {
        jobId: '3',
        jobName: 'c',
        jobPipelineId: '1234',
        annotations: {},
        prParentJobId: null,
        prNum: null,
        stageName: 'N/A',
        isVirtualJob: false
      }
    ]);
  });

  test('it updateListViewJobs purge', async function (assert) {
    assert.expect(11);
    server.post('http://localhost:8080/v4/events', () => [
      201,
      { 'Content-Type': 'application/json' },
      JSON.stringify({
        id: '5678',
        pipelineId: '1234'
      })
    ]);

    const controller = this.owner.lookup('controller:pipeline/jobs/index');

    run(() => {
      controller.set(
        'pipeline',
        EmberObject.create({
          id: '1234',
          jobs: [
            EmberObject.create({
              id: '1',
              name: 'a',
              pipelineId: '1234',
              annotations: {},
              stageName: 'production',
              virtualJob: false
            }),
            EmberObject.create({
              id: '2',
              name: 'b',
              pipelineId: '1234',
              annotations: {},
              stageName: 'integration',
              virtualJob: false
            }),
            EmberObject.create({
              id: '3',
              name: 'c',
              pipelineId: '1234',
              annotations: {},
              stageName: 'integration',
              virtualJob: false
            }),
            EmberObject.create({
              id: '4',
              name: 'd',
              pipelineId: '1234',
              annotations: {},
              stageName: 'N/A',
              virtualJob: false
            }),
            EmberObject.create({
              id: '5',
              name: 'v',
              pipelineId: '1234',
              annotations: {},
              stageName: 'N/A',
              virtualJob: true
            })
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
          jobIds: params.jobIds,
          offset: 0,
          numBuilds: ENV.APP.NUM_BUILDS_LISTED
        });

        return Promise.resolve([{ jobId: params.jobIds }]);
      });

      controller.send('updateListViewJobs');
    });

    await settled();

    assert.deepEqual(controller.jobsDetails, [
      {
        jobId: '1',
        jobName: 'a',
        jobPipelineId: '1234',
        annotations: {},
        prParentJobId: null,
        prNum: null,
        stageName: 'production',
        isVirtualJob: false
      },
      {
        jobId: '2',
        jobName: 'b',
        jobPipelineId: '1234',
        annotations: {},
        prParentJobId: null,
        prNum: null,
        stageName: 'integration',
        isVirtualJob: false
      },
      {
        jobId: '3',
        jobName: 'c',
        jobPipelineId: '1234',
        annotations: {},
        prParentJobId: null,
        prNum: null,
        stageName: 'integration',
        isVirtualJob: false
      },
      {
        jobId: '4',
        jobName: 'd',
        jobPipelineId: '1234',
        annotations: {},
        prParentJobId: null,
        prNum: null,
        stageName: 'N/A',
        isVirtualJob: false
      },
      {
        jobId: '5',
        jobName: 'v',
        jobPipelineId: '1234',
        annotations: {},
        prParentJobId: null,
        prNum: null,
        stageName: 'N/A',
        isVirtualJob: true
      }
    ]);
  });

  test('it setShowListView reset listViewOffset and jobsDetails', async function (assert) {
    assert.expect(2);

    const controller = this.owner.lookup('controller:pipeline/jobs/index');
    const listViewOffset = 10;
    const dummyJob = {};
    const jobsDetails = [dummyJob, dummyJob, dummyJob];

    run(() => {
      controller.setProperties({
        listViewOffset,
        jobsDetails
      });

      assert.equal(
        controller.listViewOffset,
        listViewOffset,
        `has listViewOffset of ${listViewOffset}`
      );
      assert.equal(controller.jobsDetails.length, 3, 'has 3 jobs');
    });
  });
});
