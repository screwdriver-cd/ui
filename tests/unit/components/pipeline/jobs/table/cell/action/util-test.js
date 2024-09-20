import { module, test } from 'qunit';
import {
  canJobBeTriggered,
  isRestartButtonDisabled,
  isStartButtonDisabled,
  isStopButtonDisabled,
  shouldDisplayNotice
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
    assert.equal(isStartButtonDisabled(true, null), true);
    assert.equal(isStartButtonDisabled(false, { state: 'DISABLED' }), true);
    assert.equal(isStartButtonDisabled(false, { state: 'ENABLED' }), false);
  });

  test('isStopButtonDisabled returns correct value', function (assert) {
    assert.equal(isStopButtonDisabled(undefined), true);
    assert.equal(isStopButtonDisabled({ status: 'COMPLETED' }), true);
    assert.equal(isStopButtonDisabled({ status: 'RUNNING' }), false);
  });

  test('isRestartButtonDisabled returns correct value', function (assert) {
    assert.equal(
      isRestartButtonDisabled(
        true,
        { state: 'ENABLED' },
        { status: 'RUNNING' }
      ),
      true
    );
    assert.equal(
      isRestartButtonDisabled(false, { state: 'ENABLED' }, null),
      true
    );
    assert.equal(
      isRestartButtonDisabled(
        false,
        { state: 'ENABLED' },
        { status: 'RUNNING' }
      ),
      true
    );
    assert.equal(
      isRestartButtonDisabled(
        false,
        { state: 'ENABLED' },
        { status: 'COMPLETED' }
      ),
      false
    );
  });

  test('shouldDisplayNotice returns correct value', function (assert) {
    assert.equal(
      shouldDisplayNotice(
        {
          workflowGraph: {
            edges: [
              { src: '~commit', dest: 'main' },
              { src: 'main', dest: 'final' }
            ]
          }
        },
        { name: 'main' }
      ),
      false
    );

    assert.equal(
      shouldDisplayNotice(
        {
          workflowGraph: {
            edges: [
              { src: '~commit', dest: 'main' },
              { src: 'main', dest: 'final' }
            ]
          }
        },
        { name: 'final' }
      ),
      true
    );
  });
});
