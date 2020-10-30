import EmberObject from '@ember/object';
import { run } from '@ember/runloop';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { settled } from '@ember/test-helpers';
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

module('Unit | Controller | pipeline/jobs/index', function(hooks) {
  setupTest(hooks);

  hooks.beforeEach(function() {
    server = new Pretender();
    this.owner.register('service:session', sessionServiceMock);
  });

  hooks.afterEach(function() {
    server.shutdown();
  });

  test('it exists', function(assert) {
    assert.ok(this.owner.lookup('controller:pipeline/jobs/index'));
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
              annotations: {}
            }),
            EmberObject.create({ id: '2', name: 'b', pipelineId: '1234', annotations: {} }),
            EmberObject.create({ id: '3', name: 'c', pipelineId: '1234', annotations: {} }),
            EmberObject.create({ id: '4', name: 'd', pipelineId: '1234', annotations: {} })
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
      {
        jobId: 1,
        jobName: 'a',
        jobPipelineId: '1234',
        annotations: {},
        prParentJobId: null,
        prNum: null
      },
      {
        jobId: 2,
        jobName: 'b',
        jobPipelineId: '1234',
        annotations: {},
        prParentJobId: null,
        prNum: null
      },
      {
        jobId: 3,
        jobName: 'c',
        jobPipelineId: '1234',
        annotations: {},
        prParentJobId: null,
        prNum: null
      }
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

    const controller = this.owner.lookup('controller:pipeline/jobs/index');

    run(() => {
      controller.set(
        'pipeline',
        EmberObject.create({
          id: '1234',
          jobs: [
            EmberObject.create({ id: '1', name: 'a', pipelineId: '1234', annotations: {} }),
            EmberObject.create({ id: '2', name: 'b', pipelineId: '1234', annotations: {} }),
            EmberObject.create({ id: '3', name: 'c', pipelineId: '1234', annotations: {} }),
            EmberObject.create({ id: '4', name: 'd', pipelineId: '1234', annotations: {} })
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
      {
        jobId: 1,
        jobName: 'a',
        jobPipelineId: '1234',
        annotations: {},
        prParentJobId: null,
        prNum: null
      },
      {
        jobId: 2,
        jobName: 'b',
        jobPipelineId: '1234',
        annotations: {},
        prParentJobId: null,
        prNum: null
      },
      {
        jobId: 3,
        jobName: 'c',
        jobPipelineId: '1234',
        annotations: {},
        prParentJobId: null,
        prNum: null
      },
      {
        jobId: 4,
        jobName: 'd',
        jobPipelineId: '1234',
        annotations: {},
        prParentJobId: null,
        prNum: null
      }
    ]);
  });

  test('it setShowListView reset listViewOffset and jobsDetails', async function(assert) {
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
        controller.get('listViewOffset'),
        listViewOffset,
        `has listViewOffset of ${listViewOffset}`
      );
      assert.equal(controller.get('jobsDetails').length, 3, 'has 3 jobs');
    });
  });
});
