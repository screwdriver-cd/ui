import { module, test } from 'qunit';
import sortJobs from 'screwdriver-ui/components/pipeline/jobs/table/util';

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
});
