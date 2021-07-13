import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { Promise as EmberPromise } from 'rsvp';

module('Integration | Component | metrics/chart', function(hooks) {
  setupRenderingTest(hooks);

  test('it does not renders chart with pending metrics data', async function(assert) {
    const metrics = new EmberPromise(() => {});
    const chartTitle = 'Downtime vs Build Count';

    this.setProperties({ metrics, chartTitle });

    await render(hbs`
      <Metrics::Chart
      @chartTitle={{this.chartTitle}}
      @metrics={{this.metrics}}/>`);

    assert.dom('.chart-c3').exists({ count: 1 });
    assert.dom('.chart-title').exists({ count: 1 });
    assert.dom('.chart-title').hasText(chartTitle, 'has chart title');
    assert.dom('.reset-button').exists({ count: 1 });
    assert.dom('.c3-text').doesNotExist();
  });

  test('it renders', async function(assert) {
    const metrics = {
      columns: [
        ['duration', 0, '42329.18', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        ['builds', 4, 3, 1, 2, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 1, 1]
      ],
      axes: {
        duration: 'y',
        builds: 'y2'
      },
      types: {
        duration: 'bar',
        builds: 'line'
      },
      names: {
        duration: 'Duration',
        builds: 'Build Count'
      },
      colors: {
        duration: '#ea0000',
        builds: '#0066df'
      }
    };
    const chartTitle = 'Downtime vs Build Count';
    const downtimeJobsChartName = 'downtimeJobsChart';
    const legends = {
      left: [
        {
          key: 'Downtime (MIN)',
          name: 'Downtime (MIN)',
          style: `border-color: #ea0000`
        }
      ],
      right: [
        {
          key: 'Build Count',
          name: 'Build Count',
          style: `border-color: #0066df`
        }
      ]
    };
    const downtimeJobsAxis = {
      x: {
        type: 'category',
        label: {
          text: 'LOCAL DATE TIME',
          position: 'outer-center'
        },
        height: 70,
        tick: {
          centered: true,
          outer: false,
          fit: false,
          multiline: true,
          multilineMax: 2,
          width: 80
        }
      },
      y: {
        tick: {
          outer: false
        },
        padding: {
          top: 10,
          bottom: 0
        }
      },
      y2: {
        min: 0,
        tick: {
          outer: false
        },
        show: true
      }
    };
    const resetZoom = () => {};

    this.setProperties({
      metrics,
      downtimeJobsChartName,
      chartTitle,
      downtimeJobsAxis,
      resetZoom,
      legends
    });

    await render(hbs`
      <Metrics::Chart
        @chartTitle={{this.chartTitle}}
        @chartName={{this.downtimeJobsChartName}}
        @legends={{this.legends}}
        @resetZoom={{this.resetZoom}}

        @name={{this.downtimeJobsChartName}}
        @metrics={{this.metrics}}
        @axis={{this.downtimeJobsAxis}}
        @tooltip={{this.tooltip}}
        @onrendered={{this.onrendered}}
        @onresized={{this.onresized}}
        @oninit={{this.oninit}}
      />
    `);

    assert.dom('.chart-c3').exists({ count: 1 });
    assert.dom('.chart-title').exists({ count: 1 });
    assert.dom('.chart-title').hasText(chartTitle, 'has chart title');
    assert.dom('.pull-left').hasText('Downtime (MIN)', 'has left legend');
    assert.dom('.pull-right').hasText('Build Count', 'has right legend');
    assert.dom('.reset-button').exists({ count: 1 });
    assert.dom('.c3-text').exists({ count: 1 });
    assert.dom('g.c3-chart-bar.c3-target.c3-target-duration').exists({ count: 1 }, 'has 1 downtime job');
    assert.dom('.c3-shape.c3-circle').exists({ count: 19 }, 'has 19 builds');
  });
});
