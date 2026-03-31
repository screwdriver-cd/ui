import { module, test } from 'qunit';
import sortJobs, {
  sortByProperties
} from 'screwdriver-ui/components/pipeline/jobs/table/util';

module('Unit | Component | pipeline/jobs/table/util', function () {
  test('sortJobs compares jobs correctly', function (assert) {
    assert.equal(
      sortJobs(
        {
          job: { name: 'a' }
        },
        {
          job: { name: 'b' }
        }
      ),
      -1
    );
    assert.equal(
      sortJobs(
        {
          job: { name: 'a' },
          stageName: 'abc'
        },
        {
          job: { name: 'a' },
          stageName: 'zoo'
        }
      ),
      -1
    );
    assert.equal(
      sortJobs(
        {
          job: { name: 'a' }
        },
        {
          job: { name: 'a' },
          stageName: 'zoo'
        }
      ),
      1
    );
    assert.equal(
      sortJobs(
        {
          build: { status: 'SUCCESS' }
        },
        {}
      ),
      -2
    );
    assert.equal(
      sortJobs(
        {
          build: { status: 'SUCCESS' }
        },
        {
          build: { status: 'FAILURE' }
        }
      ),
      3
    );
  });

  test('sortByProperties sorts rows by the active sort descriptor', function (assert) {
    const records = [
      { job: { id: 1 }, jobName: 'b', stageName: 'stage-b', startTime: 2 },
      { job: { id: 2 }, jobName: 'a', stageName: 'stage-b', startTime: 3 },
      { job: { id: 3 }, jobName: 'c', stageName: 'stage-a', startTime: 1 }
    ];

    assert.deepEqual(
      sortByProperties(records, 'jobName:asc').map(record => record.job.id),
      [2, 1, 3]
    );

    assert.deepEqual(
      sortByProperties(records, 'stageName:asc').map(record => record.job.id),
      [3, 1, 2]
    );

    assert.deepEqual(
      sortByProperties(records, 'startTime:desc').map(record => record.job.id),
      [2, 1, 3]
    );
  });
});
