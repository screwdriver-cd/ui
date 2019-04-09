import { moduleFor, test } from 'ember-qunit';
import wait from 'ember-test-helpers/wait';
import { run } from '@ember/runloop';
import sinon from 'sinon';
import { model as makeMetricsMock } from '../../../mock/metrics';

let chartMock;
let metricsMock;

moduleFor('controller:pipeline/metrics', 'Unit | Controller | pipeline/metrics', {
  needs: ['model:metric', 'model:pipeline', 'model:job', 'adapter:application', 'service:session'],
  beforeEach() {
    metricsMock = makeMetricsMock();
    chartMock = {
      internal: {
        x: {
          orgDomain: sinon.stub().returns([0, 100])
        },
        subX: {
          orgDomain: sinon.stub().returns([0, 1000])
        },
        hideTooltip: sinon.stub(),
        tooltip: {
          classed: sinon.stub()
        }
      },
      tooltip: {},
      hide: sinon.stub(),
      show: sinon.stub(),
      zoom: sinon.stub()
    };
  }
});

test('it exists', function (assert) {
  let controller = this.subject();

  assert.ok(controller);
});

test('it creates chart configurations for events, builds and steps charts', function (assert) {
  let controller = this.subject();

  run(() => {
    controller.set('model', metricsMock);
  });

  return wait().then(() => {
    assert.ok(controller.get('metrics'));
    assert.deepEqual(controller.get('eventMetrics.columns'), [
      ['total', ...metricsMock.metrics.events.total],
      ['duration', ...metricsMock.metrics.events.duration],
      ['imagePullTime', ...metricsMock.metrics.events.imagePullTime],
      ['queuedTime', ...metricsMock.metrics.events.queuedTime]
    ]);
    assert.equal(controller.get('eventMetrics.hide'), 'total');
    assert.deepEqual(JSON.parse(JSON.stringify(controller.get('eventLegend'))), [
      {
        key: 'duration',
        name: 'Duration',
        style: {
          string: 'border-color:#16c045 #ea0000 #ea0000 #16c045'
        }
      },
      {
        key: 'queuedTime',
        name: 'Queued',
        style: {
          string: 'border-color:#c5c5c5'
        }
      },
      {
        key: 'imagePullTime',
        name: 'Image Pull',
        style: {
          string: 'border-color:#dfdfdf'
        }
      }
    ]);
    assert.deepEqual(controller.get('buildMetrics.json'), metricsMock.metrics.builds);
    assert.deepEqual(controller.get('buildMetrics.keys.value'), [
      'main',
      'publish',
      'beta',
      'prod'
    ]);
    assert.deepEqual(JSON.parse(JSON.stringify(controller.get('buildLegend'))), [
      {
        key: 'main',
        name: 'main',
        style: {
          string: 'border-color:#87d812'
        }
      },
      {
        key: 'publish',
        name: 'publish',
        style: {
          string: 'border-color:#fed800'
        }
      },
      {
        key: 'beta',
        name: 'beta',
        style: {
          string: 'border-color:#1ac6f4'
        }
      },
      {
        key: 'prod',
        name: 'prod',
        style: {
          string: 'border-color:#6e2ebf'
        }
      }
    ]);
    assert.deepEqual(controller.get('stepMetrics.json'), metricsMock.metrics.steps.data);
    assert.deepEqual(controller.get('stepMetrics.keys.value'), [
      'install',
      'install-browsers',
      'sd-setup-init',
      'sd-setup-launcher',
      'sd-setup-scm',
      'sd-setup-screwdriver-cache-bookend',
      'sd-teardown-screwdriver-artifact-bookend',
      'sd-teardown-screwdriver-cache-bookend',
      'sd-teardown-screwdriver-coverage-bookend',
      'test'
    ]);
    assert.deepEqual(JSON.parse(JSON.stringify(controller.get('stepLegend'))), [
      {
        key: 'install',
        name: 'install',
        style: {
          string: 'border-color:#87d812'
        }
      },
      {
        key: 'install-browsers',
        name: 'install-browsers',
        style: {
          string: 'border-color:#fed800'
        }
      },
      {
        key: 'sd-setup-init',
        name: 'sd-setup-init',
        style: {
          string: 'border-color:#1ac6f4'
        }
      },
      {
        key: 'sd-setup-launcher',
        name: 'sd-setup-launcher',
        style: {
          string: 'border-color:#6e2ebf'
        }
      },
      {
        key: 'sd-setup-scm',
        name: 'sd-setup-scm',
        style: {
          string: 'border-color:#1f77b4'
        }
      },
      {
        key: 'sd-setup-screwdriver-cache-bookend',
        name: 'sd-setup-screwdriver-cache-bookend',
        style: {
          string: 'border-color:#aec7e8'
        }
      },
      {
        key: 'sd-teardown-screwdriver-artifact-bookend',
        name: 'sd-teardown-screwdriver-artifact-bookend',
        style: {
          string: 'border-color:#ff7f0e'
        }
      },
      {
        key: 'sd-teardown-screwdriver-cache-bookend',
        name: 'sd-teardown-screwdriver-cache-bookend',
        style: {
          string: 'border-color:#2ca02c'
        }
      },
      {
        key: 'sd-teardown-screwdriver-coverage-bookend',
        name: 'sd-teardown-screwdriver-coverage-bookend',
        style: {
          string: 'border-color:#ffbb78'
        }
      },
      {
        key: 'test',
        name: 'test',
        style: {
          string: 'border-color:#98df8a'
        }
      }
    ], 'stepLegend');
    assert.ok(controller.get('axis.x'));
    assert.ok(controller.get('axis.y'));
    assert.ok(controller.get('tooltip.contents'));
    assert.ok(controller.get('color.pattern'));
    assert.ok(controller.get('size'));
    assert.ok(controller.get('transition'));
    assert.ok(controller.get('grid'));
    assert.ok(controller.get('bar'));
    assert.notOk(controller.get('legend.show'));
    assert.ok(controller.get('point'));
    assert.ok(controller.get('subchart'));
    assert.ok(controller.get('zoom'));
    assert.ok(controller.get('onInitFns'));
    assert.ok(controller.get('setDates'));
  });
});

test('it toggles trendline chart', function (assert) {
  let controller = this.subject();

  run(() => {
    controller.set('model', metricsMock);
    controller.set('eventsChart', chartMock);
  });

  return wait().then(() => {
    controller.send('toggleTrendlineView', true);
    assert.equal(controller.get('inTrendlineView'), true);
    assert.deepEqual(JSON.parse(JSON.stringify(controller.get('eventLegend'))), [
      {
        key: 'total',
        name: 'Event Duration',
        style: {
          string: 'border-color:#0066df'
        }
      }
    ], 'eventLegend');
    assert.ok(chartMock.internal.x.orgDomain.called);
    assert.ok(chartMock.show.calledWith('total'));
    assert.ok(chartMock.hide.calledWith(['queuedTime', 'imagePullTime', 'duration']));
    assert.ok(chartMock.zoom.calledWith([0, 100]));
  });
});

test('it sets dates, range and job id', function (assert) {
  let controller = this.subject();

  run(() => {
    controller.set('model', metricsMock);
    controller.set('setDates', sinon.stub());
    controller.set('actions.setJobId', sinon.stub());

    assert.equal(controller.get('selectedRange'), '1wk');
    assert.equal(controller.get('startTime'), metricsMock.startTime);
    assert.equal(controller.get('endTime'), metricsMock.endTime);
    assert.equal(controller.get('selectedJobName'), 'main');
  });

  return wait().then(() => {
    const start = new Date();
    const startISO = start.toISOString();
    const end = new Date(start);

    end.setHours(23, 59, 59);

    const endISO = end.toISOString();

    controller.send('setTimeRange', '1mo');
    assert.equal(controller.get('selectedRange'), '1mo');

    controller.send('setCustomRange', [start, end]);
    assert.ok(controller.get('setDates').calledWith(startISO, endISO));

    controller.send('selectJob', 'publish');
    assert.ok(controller.get('actions.setJobId').calledWith(157));

    controller.send('selectJob', 'do not exist');
    assert.equal(controller.get('errorMessage'), 'Unknown Job: do not exist');
  });
});

test('it resets chart zoom level', function (assert) {
  let controller = this.subject();

  run(() => {
    controller.set('model', metricsMock);
    controller.set('eventsChart', chartMock);
    controller.set('buildsChart', chartMock);
  });

  return wait().then(() => {
    controller.send('resetZoom', 'eventsChart', 'buildsChart', {});

    assert.ok(chartMock.internal.x.orgDomain.calledTwice);
    assert.ok(chartMock.internal.subX.orgDomain.calledTwice);
    assert.ok(chartMock.internal.hideTooltip.calledTwice);
    assert.ok(chartMock.internal.tooltip.classed.calledTwice);
    assert.ok(chartMock.internal.tooltip.classed.calledWith('locked', false));
    assert.ok(chartMock.zoom.calledTwice);
    assert.ok(chartMock.zoom.calledWith([0, 1000]));
  });
});
