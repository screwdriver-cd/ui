import { module, test } from 'qunit';
import {
  getDisplayName,
  getStageName,
  sortJobs
} from 'screwdriver-ui/components/pipeline/jobs/table/util';

module('Unit | Component | pipeline/jobs/table/util', function () {
  test('getDisplayName uses job name', function (assert) {
    const job = { name: 'abc123' };

    assert.equal(getDisplayName(job), job.name);
  });

  test('getDisplayName uses configured annotation name', function (assert) {
    const configuredName = 'configuredName';
    const job = {
      name: 'abc123',
      permutations: [
        { annotations: { 'screwdriver.cd/displayName': configuredName } }
      ]
    };

    assert.equal(getDisplayName(job), configuredName);
  });

  test('getDisplayName removes PR- prefix', function (assert) {
    const prNum = 123;
    const job = { name: `PR-${prNum}:abc123` };

    assert.equal(getDisplayName(job, prNum), 'abc123');
  });

  test('getStageName uses stage name', function (assert) {
    const job = {
      name: 'abc123',
      permutations: [
        {
          stage: {
            name: 'production'
          }
        }
      ]
    };

    assert.equal(getStageName(job), job.permutations[0].stage.name);
  });

  test('getStageName returns null when stage name when it does not exist', function (assert) {
    const job = {
      name: 'abc123',
      permutations: [{}]
    };

    assert.equal(getStageName(job), undefined);
  });

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
