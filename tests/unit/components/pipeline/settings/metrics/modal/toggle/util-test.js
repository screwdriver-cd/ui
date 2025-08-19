import { module, test } from 'qunit';
import getJobIdsForPayload from 'screwdriver-ui/components/pipeline/settings/metrics/modal/toggle/util';

module(
  'Unit | Component | pipeline/settings/metrics/modal/toggle/util',
  function () {
    const jobs = [{ id: 1 }, { id: 2 }];

    test('getJobIdsForPayload adds jobs when none already exist', function (assert) {
      const pipeline = {
        settings: {}
      };

      assert.deepEqual(getJobIdsForPayload(pipeline, jobs, true), [1, 2]);
    });

    test('getJobIdsForPayload adds jobs when jobs already exist', function (assert) {
      const pipeline = {
        settings: {
          metricsDowntimeJobs: [3]
        }
      };

      assert.deepEqual(getJobIdsForPayload(pipeline, jobs, true), [1, 2, 3]);
    });

    test('getJobIdsForPayload remove jobs when none already exist', function (assert) {
      const pipeline = {
        settings: {}
      };

      assert.deepEqual(getJobIdsForPayload(pipeline, jobs, false), []);
    });

    test('getJobIdsForPayload remove jobs when none already exist', function (assert) {
      const pipeline = {
        settings: {
          metricsDowntimeJobs: [1, 3]
        }
      };

      assert.deepEqual(getJobIdsForPayload(pipeline, jobs, false), [3]);
    });
  }
);
