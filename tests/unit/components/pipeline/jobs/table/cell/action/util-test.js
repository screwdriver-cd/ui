import { module, test } from 'qunit';
import {
  canJobBeTriggered,
  isStartButtonDisabled,
  isStopButtonDisabled
} from 'screwdriver-ui/components/pipeline/jobs/table/cell/actions/util';

module('Unit | Component | pipeline/jobs/table/cell/action/util', function () {
  test('canJobBeTriggers returns correct value', function (assert) {
    assert.equal(canJobBeTriggered({ state: 'DISABLED' }), false);
    assert.equal(canJobBeTriggered({ state: 'ENABLED' }), true);
    assert.equal(
      canJobBeTriggered({
        state: 'ENABLED',
        permutations: [
          { annotations: { 'screwdriver.cd/manualStartEnabled': false } }
        ]
      }),
      false
    );
  });

  test('isStartButtonDisabled returns correct value', function (assert) {
    assert.equal(isStartButtonDisabled(true, false, null), true);
    assert.equal(isStartButtonDisabled(false, false, null), true);
    assert.equal(
      isStartButtonDisabled(false, true, { state: 'DISABLED' }),
      true
    );
    assert.equal(
      isStartButtonDisabled(false, true, { state: 'ENABLED' }),
      false
    );
  });

  test('isStopButtonDisabled returns correct value', function (assert) {
    assert.equal(isStopButtonDisabled(undefined), true);
    assert.equal(isStopButtonDisabled({ status: 'COMPLETED' }), true);
    assert.equal(isStopButtonDisabled({ status: 'RUNNING' }), false);
  });
});
