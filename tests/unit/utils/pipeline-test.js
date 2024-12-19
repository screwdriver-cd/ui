import pipeline from 'screwdriver-ui/utils/pipeline';
import { module, test } from 'qunit';
const {
  getStateIcon,
  isInactivePipeline,
  hasInactivePipelines,
  isActivePipeline,
  hasActivePipelines
} = pipeline;

module('Unit | Utility | pipeline', function () {
  const ACTIVE_PIPELINE_1 = { id: 1, state: 'ACTIVE' };
  const ACTIVE_PIPELINE_2 = { id: 2, state: 'ACTIVE' };
  const INACTIVE_PIPELINE_1 = { id: 3, state: 'INACTIVE' };
  const INACTIVE_PIPELINE_2 = { id: 4, state: 'INACTIVE' };

  test('it gets the right fs class name for given state', assert => {
    assert.equal(getStateIcon('ACTIVE'), 'circle-check');
    assert.equal(getStateIcon('INACTIVE'), 'circle-xmark');
    assert.equal(getStateIcon('some_incorrect_state'), '');
    assert.equal(getStateIcon(''), '');
    assert.equal(getStateIcon(), '');
    assert.equal(getStateIcon(null), '');
  });

  test('it checks if pipeline is inactive', assert => {
    assert.ok(isInactivePipeline(INACTIVE_PIPELINE_1));
    assert.ok(isInactivePipeline(INACTIVE_PIPELINE_2));

    assert.notOk(isInactivePipeline(ACTIVE_PIPELINE_1));
    assert.notOk(isInactivePipeline(ACTIVE_PIPELINE_2));
  });

  test('it checks if inactive pipeline exists', assert => {
    assert.ok(hasInactivePipelines([INACTIVE_PIPELINE_1]));
    assert.ok(hasInactivePipelines([INACTIVE_PIPELINE_1]));
    assert.ok(hasInactivePipelines([INACTIVE_PIPELINE_1, INACTIVE_PIPELINE_1]));
    assert.ok(hasInactivePipelines([ACTIVE_PIPELINE_1, INACTIVE_PIPELINE_1]));

    assert.notOk(hasInactivePipelines([]));
    assert.notOk(hasInactivePipelines([ACTIVE_PIPELINE_1]));
    assert.notOk(hasInactivePipelines([ACTIVE_PIPELINE_2]));
    assert.notOk(hasInactivePipelines([ACTIVE_PIPELINE_1, ACTIVE_PIPELINE_2]));
  });

  test('it checks if pipeline is active', assert => {
    assert.ok(isActivePipeline(ACTIVE_PIPELINE_1));
    assert.ok(isActivePipeline(ACTIVE_PIPELINE_2));

    assert.notOk(isActivePipeline(INACTIVE_PIPELINE_1));
    assert.notOk(isActivePipeline(INACTIVE_PIPELINE_2));
  });

  test('it checks if active pipeline exists', assert => {
    assert.ok(hasActivePipelines([ACTIVE_PIPELINE_1]));
    assert.ok(hasActivePipelines([ACTIVE_PIPELINE_2]));
    assert.ok(hasActivePipelines([ACTIVE_PIPELINE_1, ACTIVE_PIPELINE_2]));
    assert.ok(hasActivePipelines([ACTIVE_PIPELINE_1, INACTIVE_PIPELINE_1]));

    assert.notOk(hasActivePipelines([]));
    assert.notOk(hasActivePipelines([INACTIVE_PIPELINE_1]));
    assert.notOk(hasActivePipelines([INACTIVE_PIPELINE_2]));
    assert.notOk(
      hasActivePipelines([INACTIVE_PIPELINE_1, INACTIVE_PIPELINE_2])
    );
  });
});
