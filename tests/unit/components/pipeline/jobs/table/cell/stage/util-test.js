import { module, test } from 'qunit';
import getStageName from 'screwdriver-ui/components/pipeline/jobs/table/cell/stage/util';

module('Unit | Component | pipeline/jobs/table/cell/stage/util', function () {
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

  test('getStageName uses default stage name when it does not exist', function (assert) {
    const job = {
      name: 'abc123',
      permutations: [{}]
    };

    assert.equal(getStageName(job), 'N/A');
  });
});
