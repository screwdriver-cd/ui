import { module, test } from 'qunit';
import {
  calcNodeCenter,
  calcStageHeight,
  calcStageWidth,
  calcStageX,
  calcStageY,
  calcYPos,
  getCanvasSize,
  getElementSizes,
  getNodeWidth,
  getMaximumJobNameLength,
  getStageVerticalDisplacementByRowPosition,
  getVerticalDisplacementByRowPosition,
  icon
} from 'screwdriver-ui/utils/pipeline/graph/d3-graph-util';

module('Unit | Utility | pipeline-graph | d3-graph-util', function () {
  test('it gets the right icons', function (assert) {
    assert.equal(icon('SUCCESS'), '\ue903');
    assert.equal(icon('banana'), '\ue901');
  });

  test('getElementSizes returns correct element sizes', function (assert) {
    assert.deepEqual(getElementSizes(), {
      ICON_SIZE: 36,
      TITLE_SIZE: 12,
      ARROWHEAD: 6,
      STAGE_GAP: 4,
      STAGE_GAP_HORIZONTAL: 108,
      EDGE_GAP: 6
    });
    assert.deepEqual(getElementSizes(true), {
      ICON_SIZE: 12,
      TITLE_SIZE: 0,
      ARROWHEAD: 2,
      STAGE_GAP: 12 / 9,
      STAGE_GAP_HORIZONTAL: 36,
      EDGE_GAP: 2
    });
  });

  test('getMaximumJobNameLength returns maximum job name length', function (assert) {
    const data = {
      nodes: [{ name: 'job1' }, { name: '0123456789' }, { name: 'job3' }]
    };

    assert.equal(getMaximumJobNameLength(data, 20), 10);
    assert.equal(getMaximumJobNameLength(data, 5), 5);
  });

  test('getMaximumJobNameLength returns maximum job name length when job has displayName', function (assert) {
    const data = {
      nodes: [
        { name: 'job1' },
        { name: 'job2', displayName: '0123456789' },
        { name: 'job3' },
        { name: '~sd@1:foo', displayName: '0123456789/0123456789' }
      ]
    };

    assert.equal(getMaximumJobNameLength(data, 20), 10);
    assert.equal(getMaximumJobNameLength(data, 5), 5);
  });

  test('getNodeWidth returns correct node width', function (assert) {
    assert.equal(getNodeWidth({ ICON_SIZE: 10, TITLE_SIZE: 5 }, 10), 70);
    assert.equal(getNodeWidth({ ICON_SIZE: 10, TITLE_SIZE: 5 }, 2), 20);
    assert.equal(getNodeWidth({ ICON_SIZE: 10, TITLE_SIZE: 0 }, 10), 20);
  });

  test('calcNodeCenter returns correct value for center of node', function (assert) {
    assert.equal(calcNodeCenter(6, 10), 65);
  });

  test('getCanvasSize returns correct canvas size', function (assert) {
    const data = {
      meta: { width: 3, height: 2 }
    };

    let sizes = {
      ICON_SIZE: 10,
      TITLE_SIZE: 5
    };

    assert.equal(getCanvasSize(data, sizes, 20).w, 420);
    assert.equal(getCanvasSize(data, sizes, 20).h, 40);
    assert.equal(getCanvasSize(data, sizes, 2).w, 60);
    assert.equal(getCanvasSize(data, sizes, 2).h, 40);

    sizes = {
      ICON_SIZE: 10,
      TITLE_SIZE: 0
    };

    assert.equal(getCanvasSize(data, sizes, 5).w, 60);
    assert.equal(getCanvasSize(data, sizes, 5).h, 40);
  });

  test('getVerticalDisplacementByRowPosition returns correct vertical displacement', function (assert) {
    const verticalDisplacements = { 0: 23, 1: 35 };

    assert.equal(
      getVerticalDisplacementByRowPosition(0, verticalDisplacements),
      23
    );
    assert.equal(
      getVerticalDisplacementByRowPosition(5, verticalDisplacements),
      0
    );
    assert.equal(getVerticalDisplacementByRowPosition(1), 0);
  });

  test('calcYPos returns correct y position', function (assert) {
    const sizes = { ICON_SIZE: 10 };
    const verticalDisplacements = { 0: 23, 1: 35 };

    assert.equal(calcYPos(1, sizes, verticalDisplacements), 50);
    assert.equal(calcYPos(2, sizes, verticalDisplacements), 25);
    assert.equal(calcYPos(1, sizes, verticalDisplacements, 14), 64);
    assert.equal(calcYPos(2, sizes, verticalDisplacements, 10), 45);
    assert.equal(calcYPos(1, sizes, null, 14), 29);
    assert.equal(calcYPos(2, sizes, null, 10), 45);
    assert.equal(calcYPos(1, sizes), 15);
    assert.equal(calcYPos(2, sizes), 25);
  });

  test('calcStageX returns correct value for x position of stage', function (assert) {
    const stage = { pos: { x: 2 } };
    const sizes = {
      STAGE_GAP: 5
    };
    const horizontalDisplacements = { 0: 23, 1: 23, 2: 45 };

    assert.equal(calcStageX(stage, 10, sizes), 25);
    assert.equal(calcStageX(stage, 10, sizes, horizontalDisplacements), 70);
  });

  test('calcStageY returns correct value for y position of stage', function (assert) {
    const stage = { pos: { y: 2 } };
    const sizes = { ICON_SIZE: 10, STAGE_GAP: 3 };
    const verticalDisplacements = { 0: 23, 1: 35 };

    assert.equal(calcStageY(stage, sizes, verticalDisplacements), 43);
    assert.equal(calcStageY(stage, sizes, verticalDisplacements, 7), 36);
  });

  test('calcStageWidth returns correct value for width of stage', function (assert) {
    const stage = { graph: { meta: { width: 3 } }, pos: { x: 2 } };
    const stageVerticalDisplacements = {
      0: 23,
      1: 35,
      2: 13,
      3: 13,
      4: 43,
      5: 23
    };
    const sizes = { STAGE_GAP: 5 };

    assert.equal(calcStageWidth(stage, 10, sizes), 25);
    assert.equal(
      calcStageWidth(stage, 10, sizes, stageVerticalDisplacements),
      55
    );
  });

  test('calcStageHeight returns correct value for height of stage', function (assert) {
    const stage = { graph: { meta: { height: 3 } }, pos: { y: 2 } };
    const stageVerticalDisplacements = { 0: 23, 1: 35, 2: 13, 4: 10, 5: 23 };
    const sizes = { ICON_SIZE: 10, STAGE_GAP: 3 };

    assert.equal(calcStageHeight(stage, sizes), 57);
    assert.equal(calcStageHeight(stage, sizes, stageVerticalDisplacements), 80);
  });

  test('getStageVerticalDisplacementByRowPosition returns correct vertical stage displacement', function (assert) {
    const stageVerticalDisplacements = { 0: 23, 1: 35, 2: 13, 5: 83 };

    assert.equal(
      getStageVerticalDisplacementByRowPosition(
        0,
        1,
        stageVerticalDisplacements
      ),
      58
    );
    assert.equal(
      getStageVerticalDisplacementByRowPosition(
        2,
        4,
        stageVerticalDisplacements
      ),
      13
    );
    assert.equal(
      getStageVerticalDisplacementByRowPosition(
        1,
        5,
        stageVerticalDisplacements
      ),
      131
    );
  });
});
