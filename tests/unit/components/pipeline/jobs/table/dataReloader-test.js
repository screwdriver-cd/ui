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

    assert.equal(dataReloader.jobIds.length, 3);
    assert.equal(dataReloader.jobIds[0], 0);
    assert.equal(dataReloader.jobIds[1], 1);
    assert.equal(dataReloader.jobIds[2], 2);

    dataReloader.updateJobsMatchingFilter(jobIds, 50, 1);
    assert.equal(dataReloader.jobIds.length, jobIds.length);

    dataReloader.updateJobsMatchingFilter(jobIds, 3, 2, true);
    assert.equal(dataReloader.jobIds.length, jobIds.length);
    assert.equal(dataReloader.jobIds[0], 0);
    assert.equal(dataReloader.jobIds[9], 9);

    dataReloader.updateJobsMatchingFilter(jobIds, 3, 2);
    assert.equal(dataReloader.jobIds.length, 3);
    assert.equal(dataReloader.jobIds[0], 3);
    assert.equal(dataReloader.jobIds[1], 4);
    assert.equal(dataReloader.jobIds[2], 5);

    dataReloader.updateJobsMatchingFilter(jobIds, 5, 1);

    assert.equal(dataReloader.jobIds.length, 5);
    assert.equal(dataReloader.jobIds[0], 0);
    assert.equal(dataReloader.jobIds[1], 1);
    assert.equal(dataReloader.jobIds[2], 2);
    assert.equal(dataReloader.jobIds[3], 3);
    assert.equal(dataReloader.jobIds[4], 4);
  });

  test('fetchBuildsForJobs fetches builds and calls callback', async function (assert) {
    const jobId = 1;
    const builds = [
      { id: 11, status: 'SUCCESS' },
      {
        id: 12,
        status: 'SUCCESS',
        meta: { build: { warning: { message: 'Oops' } } }
      }
    ];
    const buildStatuses = [{ jobId, builds }];
    const shuttle = { fetchFromApi: () => {} };
    const buildsCallbackSpy = sinon.spy(returnedBuilds => {
      assert.equal(returnedBuilds.has(jobId), true);
      assert.equal(returnedBuilds.get(jobId).length, 2);
      assert.equal(returnedBuilds.get(jobId)[0].status, 'SUCCESS');
      assert.equal(returnedBuilds.get(jobId)[1].status, 'WARNING');
    });

    sinon.stub(shuttle, 'fetchFromApi').resolves(buildStatuses);

    const dataReloader = new DataReloader(
      { shuttle },
      [jobId],
      10,
      null,
      buildsCallbackSpy
    );

    await dataReloader.fetchBuildsForJobs();
    assert.equal(buildsCallbackSpy.callCount, 1);
  });

  test('fetchBuildsForJobs ignores stale responses', async function (assert) {
    assert.expect(3);

    const shuttle = { fetchFromApi: () => {} };
    const buildsCallbackSpy = sinon.spy();

    let resolveFirstRequest;

    let resolveSecondRequest;

    sinon.stub(shuttle, 'fetchFromApi').callsFake(url => {
      if (url.includes('jobIds=1')) {
        return new Promise(resolve => {
          resolveFirstRequest = resolve;
        });
      }

      return new Promise(resolve => {
        resolveSecondRequest = resolve;
      });
    });

    const dataReloader = new DataReloader(
      { shuttle },
      [1],
      10,
      null,
      buildsCallbackSpy
    );

    const firstFetch = dataReloader.fetchBuildsForJobs();

    dataReloader.updateJobsMatchingFilter([2], 10, 1);

    const secondFetch = dataReloader.fetchBuildsForJobs();

    resolveSecondRequest([
      { jobId: 2, builds: [{ id: 22, status: 'SUCCESS' }] }
    ]);
    await secondFetch;

    resolveFirstRequest([
      { jobId: 1, builds: [{ id: 11, status: 'FAILURE' }] }
    ]);
    await firstFetch;

    assert.equal(buildsCallbackSpy.callCount, 1);
    assert.equal(buildsCallbackSpy.firstCall.args[0].has(2), true);
    assert.equal(buildsCallbackSpy.firstCall.args[0].has(1), false);
  });
});
