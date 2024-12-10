import { module, test } from 'qunit';
import getDisplayName from 'screwdriver-ui/components/pipeline/jobs/table/util';

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
});
