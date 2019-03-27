import { moduleFor, test } from 'ember-qunit';
import wait from 'ember-test-helpers/wait';
import { run } from '@ember/runloop';
import sinon from 'sinon';
import { model as makeMetricsMock } from '../../../mock/metrics';

let chartMock;
let metricsMock;

moduleFor('controller:pipeline/metrics', 'Unit | Controller | pipeline/metrics', {
  needs: ['model:metric', 'model:pipeline', 'model:job', 'adapter:application'],
  beforeEach() {
    metricsMock = makeMetricsMock();
    chartMock = {
      internal: {
        x: {
          orgDomain: sinon.stub().returns([0, 100])
        },
        subX: {
          orgDomain: sinon.stub().returns([0, 1000])
        }
      },
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

test('it creates chart configurations for events and builds charts', function (assert) {
  let controller = this.subject();

  run(() => {
    controller.set('model', metricsMock);
  });

  return wait().then(() => {
    assert.ok(controller.get('metrics'));
    assert.deepEqual(controller.get('eventMetrics.columns'), [
      metricsMock.metrics.events.queuedTime,
      metricsMock.metrics.events.imagePullTime,
      metricsMock.metrics.events.duration,
      metricsMock.metrics.events.total
    ]);
    assert.equal(controller.get('eventMetrics.hide'), 'total');
    assert.deepEqual(
      controller.get('buildMetrics.json'),
      metricsMock.metrics.builds,
      'buildMetrics.json'
    );
    assert.deepEqual(controller.get('buildMetrics.keys.value'), [
      'beta',
      'main',
      'prod',
      'publish'
    ]);
    assert.equal(controller.get('legend.hide'), 'total');
    assert.ok(controller.get('axis.x'));
    assert.ok(controller.get('axis.y'));
    assert.ok(controller.get('tooltip.contents'));
    assert.ok(controller.get('color.pattern'));
    assert.ok(controller.get('size'));
    assert.ok(controller.get('transition'));
    assert.ok(controller.get('grid'));
    assert.ok(controller.get('bar'));
    assert.ok(controller.get('point'));
    assert.ok(controller.get('subchart'));
    assert.ok(controller.get('zoom'));
    assert.ok(controller.get('onrendered'));
    assert.ok(controller.get('onInitFns'));
    assert.ok(controller.get('setDate'));
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
    assert.ok(chartMock.internal.x.orgDomain.called);
    assert.ok(chartMock.show.calledWith('total', { withLegend: true }));
    assert.ok(
      chartMock.hide.calledWith(['queuedTime', 'imagePullTime', 'duration'], {
        withLegend: true
      })
    );
    assert.ok(chartMock.zoom.calledWith([0, 100]));
  });
});

test('it sets dates and range', function (assert) {
  let controller = this.subject();

  run(() => {
    controller.set('model', metricsMock);
    controller.set('setDate', sinon.stub());
    assert.equal(controller.get('selectedRange'), '1wk');
    assert.equal(controller.get('startTime'), metricsMock.startTime);
    assert.equal(controller.get('endTime'), metricsMock.endTime);
  });

  return wait().then(() => {
    const date = new Date().toISOString().split('.')[0];

    controller.send('setTimeRange', '1mo');
    assert.equal(controller.get('selectedRange'), '1mo');

    controller.send('setStartDate', date);
    assert.ok(controller.get('setDate').calledWith('startTime', date));

    controller.send('setEndDate', date);
    assert.ok(controller.get('setDate').calledWith('endTime', date));
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
    controller.send('resetZoom', 'eventsChart', 'buildsChart');

    assert.ok(chartMock.internal.x.orgDomain.calledTwice);
    assert.ok(chartMock.internal.subX.orgDomain.calledTwice);
    assert.ok(chartMock.zoom.calledTwice);
    assert.ok(chartMock.zoom.calledWith([0, 1000]));
  });
});
