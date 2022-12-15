import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { settled } from '@ember/test-helpers';
import { run } from '@ember/runloop';
import sinon from 'sinon';
import Service from '@ember/service';
import { model as makeMetricsMock } from '../../../mock/metrics';

let chartMock;

let metricsMock;

module('Unit | Controller | pipeline/metrics', function (hooks) {
  setupTest(hooks);

  hooks.beforeEach(function () {
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
  });

  test('it exists', function (assert) {
    const controller = this.owner.lookup('controller:pipeline/metrics');

    assert.ok(controller);
  });

  test('it creates chart configurations for events, builds and steps charts', function (assert) {
    const controller = this.owner.lookup('controller:pipeline/metrics');

    run(() => {
      controller.set('model', metricsMock);
    });

    return settled().then(() => {
      assert.ok(controller.metrics);
      assert.deepEqual(controller.get('eventMetrics.columns'), [
        ['total', ...metricsMock.metrics.events.total],
        ['duration', ...metricsMock.metrics.events.duration],
        ['imagePullTime', ...metricsMock.metrics.events.imagePullTime],
        ['queuedTime', ...metricsMock.metrics.events.queuedTime]
      ]);
      assert.equal(controller.get('eventMetrics.hide'), 'total');
      assert.deepEqual(JSON.parse(JSON.stringify(controller.eventLegend)), [
        {
          key: 'duration',
          name: 'Duration',
          style: {
            string: 'border-color:#03af7a #ff4b00 #ff4b00 #03af7a'
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
      assert.deepEqual(
        controller.get('buildMetrics.json'),
        metricsMock.metrics.builds
      );
      assert.deepEqual(controller.get('buildMetrics.keys.value'), [
        'main',
        'publish',
        'beta',
        'prod'
      ]);
      assert.deepEqual(JSON.parse(JSON.stringify(controller.buildLegend)), [
        {
          key: 'main',
          name: 'main',
          class: { string: '' },
          style: { string: 'border-color:#87d812' }
        },
        {
          key: 'publish',
          name: 'publish',
          class: { string: 'unselected' },
          style: { string: 'border-color:#fed800' }
        },
        {
          key: 'beta',
          name: 'beta',
          class: { string: 'unselected' },
          style: { string: 'border-color:#1ac6f4' }
        },
        {
          key: 'prod',
          name: 'prod',
          class: { string: 'unselected' },
          style: { string: 'border-color:#6e2ebf' }
        }
      ]);
      assert.deepEqual(
        controller.get('stepMetrics.json'),
        metricsMock.metrics.steps.data
      );
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
      assert.deepEqual(
        JSON.parse(JSON.stringify(controller.stepLegend)),
        [
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
        ],
        'stepLegend'
      );
      assert.ok(controller.get('axis.x'));
      assert.ok(controller.get('axis.y'));
      assert.ok(controller.get('tooltip.contents'));
      assert.ok(controller.get('color.pattern'));
      assert.ok(controller.size);
      assert.ok(controller.transition);
      assert.ok(controller.grid);
      assert.ok(controller.bar);
      assert.notOk(controller.get('legend.show'));
      assert.ok(controller.point);
      assert.ok(controller.subchart);
      assert.ok(controller.zoom);
      assert.ok(controller.onInitFns);
      assert.ok(controller.setDates);
    });
  });

  test('it toggles trendline chart', function (assert) {
    const controller = this.owner.lookup('controller:pipeline/metrics');

    run(() => {
      controller.set('model', metricsMock);
      controller.set('eventsChart', chartMock);
    });

    return settled().then(() => {
      controller.send('toggleTrendlineView', true);
      assert.equal(controller.inTrendlineView, true);
      assert.deepEqual(
        JSON.parse(JSON.stringify(controller.eventLegend)),
        [
          {
            key: 'total',
            name: 'Event Duration',
            style: {
              string: 'border-color:#0066df'
            }
          }
        ],
        'eventLegend'
      );
      assert.ok(chartMock.internal.x.orgDomain.called);
      assert.ok(chartMock.show.calledWith('total'));
      assert.ok(
        chartMock.hide.calledWith(['queuedTime', 'imagePullTime', 'duration'])
      );
      assert.ok(chartMock.zoom.calledWith([0, 100]));
    });
  });

  test('it sets dates, range and job id', function (assert) {
    const controller = this.owner.lookup('controller:pipeline/metrics');

    const routerServiceMock = Service.extend({
      transitionTo: () => {
        assert.ok(true);
      }
    });

    this.owner.unregister('service:router');
    this.owner.register('service:router', routerServiceMock);

    run(() => {
      controller.set('model', metricsMock);
      controller.set('setDates', sinon.stub());
      controller.set('actions.setJobId', sinon.stub());

      assert.equal(controller.selectedRange, '1wk');
      assert.equal(controller.startTime, metricsMock.startTime);
      assert.equal(controller.endTime, metricsMock.endTime);
      assert.equal(controller.selectedJobName, 'main');
    });

    return settled().then(() => {
      const start = new Date();
      const startISO = start.toISOString();
      const end = new Date(start);

      end.setHours(23, 59, 59);

      const endISO = end.toISOString();

      controller.send('setTimeRange', '1mo');
      assert.equal(controller.selectedRange, '1mo');

      controller.send('setCustomRange', [start, end]);
      assert.ok(controller.setDates.calledWith(startISO, endISO));

      controller.send('selectJob', 'publish');
      assert.ok(controller.get('actions.setJobId').calledWith('157'));

      controller.send('selectJob', 'do not exist');
      assert.equal(controller.errorMessage, 'Unknown Job: do not exist');
    });
  });

  test('it resets chart zoom level', function (assert) {
    const controller = this.owner.lookup('controller:pipeline/metrics');

    run(() => {
      controller.set('model', metricsMock);
      controller.set('eventsChart', chartMock);
      controller.set('buildsChart', chartMock);
    });

    return settled().then(() => {
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
});
