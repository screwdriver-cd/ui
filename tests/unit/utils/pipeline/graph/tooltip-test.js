import { module, test } from 'qunit';
import {
  getTooltipData,
  nodeCanShowTooltip
} from 'screwdriver-ui/utils/pipeline/graph/tooltip';

module('Unit | Utility | pipeline-graph | tooltip', function () {
  test('core trigger nodes can not show tooltips', function (assert) {
    assert.equal(nodeCanShowTooltip({ name: '~commit' }), false);
    assert.equal(nodeCanShowTooltip({ name: '~pr' }), false);
    assert.equal(nodeCanShowTooltip({ name: '~commit:something' }), false);
    assert.equal(nodeCanShowTooltip({ name: '~pr:another' }), false);
  });

  test('nodes can show tooltips', function (assert) {
    assert.equal(nodeCanShowTooltip({ name: 'main' }), true);
  });

  test('it gets tooltip data for external trigger', function (assert) {
    assert.deepEqual(getTooltipData({ name: '~sd@123:main' }), {
      externalTrigger: {
        jobName: 'main',
        pipelineId: '123'
      }
    });
  });

  test('it gets tooltip data for downstream trigger', function (assert) {
    assert.deepEqual(
      getTooltipData({
        name: '~sd-123-triggers',
        triggers: ['~sd@987:build']
      }),
      {
        triggers: [
          {
            triggerName: '~sd@987:build',
            pipelineId: '987',
            jobName: 'build'
          }
        ]
      }
    );
  });

  test('it gets tooltip data for active build', function (assert) {
    const workflowGraph = {
      nodes: [{ name: '~pr' }, { name: '~commit' }, { name: 'main' }],
      edges: [{ src: '~commit', dest: 'main' }]
    };
    const event = { workflowGraph, meta: { parameters: {} } };

    const tooltipData = getTooltipData(
      {
        name: 'main',
        status: 'RUNNING'
      },
      event
    );

    assert.equal(tooltipData.displayStop, true);
    assert.deepEqual(tooltipData.selectedEvent, event);
  });

  test('it gets tooltip data for completed build', function (assert) {
    const workflowGraph = {
      nodes: [{ name: '~pr' }, { name: '~commit' }, { name: 'main' }],
      edges: [{ src: '~commit', dest: 'main' }]
    };
    const event = { workflowGraph, meta: { parameters: {} } };

    const tooltipData = getTooltipData(
      {
        name: 'main',
        status: 'SUCCESS'
      },
      event
    );

    assert.equal(tooltipData.displayStop, false);
    assert.deepEqual(tooltipData.selectedEvent, event);
  });

  test('it gets tooltip data for PR event', function (assert) {
    const workflowGraph = {
      nodes: [
        { name: '~pr' },
        { name: '~commit' },
        { name: 'main' },
        { name: 'p1' }
      ],
      edges: [
        { src: '~commit', dest: 'main' },
        { src: '~pr', dest: 'p1' }
      ]
    };
    const event = {
      workflowGraph,
      meta: {
        parameters: {}
      },
      prNum: 1
    };
    const jobs = [{ name: 'p1', state: 'ENABLED' }];

    const tooltipData = getTooltipData(
      {
        name: 'p1'
      },
      event,
      jobs
    );

    assert.deepEqual(tooltipData.job, {
      name: 'p1',
      isDisabled: false
    });
    assert.deepEqual(tooltipData.selectedEvent, event);
  });

  test('it gets tooltip data for disabled job', function (assert) {
    const workflowGraph = {
      nodes: [
        { name: '~pr' },
        { name: '~commit' },
        { name: 'main' },
        { name: 'p1' }
      ],
      edges: [
        { src: '~commit', dest: 'main' },
        { src: '~pr', dest: 'p1' }
      ]
    };
    const event = {
      workflowGraph,
      meta: {
        parameters: {}
      },
      prNum: 1
    };
    const jobs = [{ name: 'p1', state: 'DISABLED', stateChangeMessage: ' ' }];

    const tooltipData = getTooltipData(
      {
        name: 'p1'
      },
      event,
      jobs
    );

    assert.deepEqual(tooltipData.job, {
      name: 'p1',
      isDisabled: true
    });
    assert.deepEqual(tooltipData.selectedEvent, event);
  });

  test('it gets tooltip data for job without build data', function (assert) {
    const workflowGraph = {
      nodes: [{ name: '~pr' }, { name: '~commit' }, { name: 'main' }],
      edges: [{ src: '~commit', dest: 'main' }]
    };
    const event = {
      workflowGraph,
      meta: {
        parameters: {}
      }
    };
    const jobs = [{ name: 'main' }];

    const tooltipData = getTooltipData(
      {
        name: 'main'
      },
      event,
      jobs
    );

    assert.deepEqual(tooltipData.job, {
      name: 'main',
      isDisabled: false
    });
    assert.deepEqual(tooltipData.selectedEvent, event);
  });

  test('it gets tooltip data for job with build data', function (assert) {
    const workflowGraph = {
      nodes: [{ name: '~pr' }, { name: '~commit' }, { name: 'main' }],
      edges: [{ src: '~commit', dest: 'main' }]
    };
    const event = {
      workflowGraph,
      meta: {
        parameters: {}
      }
    };
    const jobs = [{ name: 'main' }];
    const builds = [{ id: 123, status: 'SUCCESS' }];

    const tooltipData = getTooltipData(
      {
        name: 'main'
      },
      event,
      jobs,
      builds
    );

    assert.deepEqual(tooltipData.job, {
      name: 'main',
      isDisabled: false,
      buildId: 123,
      status: 'SUCCESS'
    });
    assert.deepEqual(tooltipData.selectedEvent, event);
  });
});
