import { module, test } from 'qunit';
import DataReloader from 'screwdriver-ui/components/pipeline/jobs/table/dataReloader';
import sinon from 'sinon';

module('Unit | Component | pipeline/jobs/table/dataReloader', function () {
  test('setCorrectBuildStatus sets correct values', function (assert) {
    const builds = [
      { status: 'SUCCESS' },
      { status: 'SUCCESS', meta: { build: { warning: { message: 'Oops' } } } }
    ];

    new DataReloader({}, [], 0).setCorrectBuildStatus(builds);

    assert.equal(builds[0].status, 'SUCCESS');
    assert.equal(builds[1].status, 'WARNING');
  });

  test('updateJobsMatchingFilter updates', function (assert) {
    const jobIds = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const dataReloader = new DataReloader({}, jobIds, 3);

    assert.equal(dataReloader.jobIdsMatchingFilter.length, 3);
    assert.equal(dataReloader.jobIdsMatchingFilter[0], 0);
    assert.equal(dataReloader.jobIdsMatchingFilter[1], 1);
    assert.equal(dataReloader.jobIdsMatchingFilter[2], 2);

    dataReloader.updateJobsMatchingFilter(jobIds, 50, 1);
    assert.equal(dataReloader.jobIdsMatchingFilter.length, jobIds.length);

    dataReloader.updateJobsMatchingFilter(jobIds, 3, 2);
    assert.equal(dataReloader.jobIdsMatchingFilter.length, 3);
    assert.equal(dataReloader.jobIdsMatchingFilter[0], 3);
    assert.equal(dataReloader.jobIdsMatchingFilter[1], 4);
    assert.equal(dataReloader.jobIdsMatchingFilter[2], 5);

    dataReloader.updateJobsMatchingFilter(jobIds, 5, 1);

    assert.equal(dataReloader.jobIdsMatchingFilter.length, 5);
    assert.equal(dataReloader.jobIdsMatchingFilter[0], 0);
    assert.equal(dataReloader.jobIdsMatchingFilter[1], 1);
    assert.equal(dataReloader.jobIdsMatchingFilter[2], 2);
    assert.equal(dataReloader.jobIdsMatchingFilter[3], 3);
    assert.equal(dataReloader.jobIdsMatchingFilter[4], 4);
  });

  test('newJobIds returns new job ids', function (assert) {
    const dataReloader = new DataReloader({}, [1, 2, 3, 4, 5], 5);

    dataReloader.jobIdsMatchingFilter = [1, 2, 6, 7, 8];
    dataReloader.jobCallbacks = { 1: [], 2: [], 3: [], 4: [], 5: [] };
    const newJobIds = dataReloader.newJobIds();

    assert.equal(newJobIds.length, 3);
    assert.equal(newJobIds[0], 6);
    assert.equal(newJobIds[1], 7);
    assert.equal(newJobIds[2], 8);
  });

  test('removeCallbacksForJobId removes entry', function (assert) {
    const dataReloader = new DataReloader({}, [1, 2], 2);

    dataReloader.jobCallbacks = { 1: [], 2: [] };
    assert.equal(Object.entries(dataReloader.jobCallbacks).length, 2);

    dataReloader.removeCallbacksForJobId(1);
    assert.equal(Object.entries(dataReloader.jobCallbacks).length, 1);
    assert.equal(dataReloader.jobCallbacks[1], undefined);
  });

  test('addCallbackForJobId adds callback', function (assert) {
    const dataReloader = new DataReloader({}, [], 0);
    const jobId = 1;
    const callback = sinon.stub();

    dataReloader.addCallbackForJobId(jobId, callback);

    assert.equal(dataReloader.jobCallbacks[jobId].length, 1);
    assert.equal(dataReloader.jobCallbacks[jobId][0], callback);
    assert.equal(callback.callCount, 0);
  });

  test('addCallbackForJobId calls callback if builds exist', function (assert) {
    const dataReloader = new DataReloader({}, [], 0);
    const jobId = 1;
    const builds = [{ id: 1 }];
    const callback = sinon.stub();

    dataReloader.builds[jobId] = builds;
    dataReloader.addCallbackForJobId(jobId, callback);

    assert.equal(dataReloader.jobCallbacks[jobId].length, 1);
    assert.equal(dataReloader.jobCallbacks[jobId][0], callback);
    assert.equal(callback.callCount, 1);
    assert.equal(callback.calledWith(builds), true);
  });

  test('fetchBuildsForJobs fetches builds and calls callbacks', async function (assert) {
    const jobId = 1;
    const jobs = [jobId];
    const builds = [
      { id: 11, status: 'SUCCESS' },
      {
        id: 12,
        status: 'SUCCESS',
        meta: { build: { warning: { message: 'Oops' } } }
      }
    ];
    const buildStatuses = [{ jobId, builds }];
    const callback = sinon.stub();
    const shuttle = { fetchFromApi: () => {} };

    sinon.stub(shuttle, 'fetchFromApi').resolves(buildStatuses);

    const dataReloader = new DataReloader({ shuttle }, [], 0);

    dataReloader.addCallbackForJobId(jobId, callback);

    await dataReloader.fetchBuildsForJobs(jobs);

    assert.equal(dataReloader.builds[jobId].length, builds.length);
    assert.equal(dataReloader.builds[jobId][0].status, 'SUCCESS');
    assert.equal(dataReloader.builds[jobId][1].status, 'WARNING');
    assert.equal(callback.callCount, 1);
    assert.equal(callback.calledWith(builds), true);
  });

  test('parseEventBuilds parses builds and calls callbacks', function (assert) {
    const jobId = 1;
    const builds = [{ id: 11, status: 'SUCCESS', jobId }];
    const callback = sinon.stub();

    const dataReloader = new DataReloader({}, [], 0);

    dataReloader.addCallbackForJobId(jobId, callback);

    dataReloader.parseEventBuilds(builds);

    assert.equal(dataReloader.builds[jobId].length, builds.length);
    assert.equal(dataReloader.builds[jobId][0].status, 'SUCCESS');
    assert.equal(callback.callCount, 1);
    assert.equal(callback.calledWith(builds), true);
  });
});
