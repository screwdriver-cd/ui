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
});
