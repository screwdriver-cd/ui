import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module('Integration | Component | metrics/base-chart', function(hooks) {
  setupRenderingTest(hooks);

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
    const chartName = 'Downtime vs Build Count';
    const axis = {
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

    this.setProperties({
      metrics,
      chartName,
      axis
    });

    await render(hbs`
      <Metrics::BaseChart
        @chartName={{this.chartName}}
        @data={{this.metrics}}
        @axis={{this.axis}}
        @tooltip={{this.tooltip}}
        @onrendered={{this.onrendered}}
        @onresized={{this.onresized}}
        @oninit={{@oninit}}
      />`);

    assert.dom('.c3-text').exists({ count: 1 });
    assert
      .dom('g.c3-chart-bar.c3-target.c3-target-duration')
      .exists({ count: 1 }, 'has 1 downtime job');
    assert.dom('.c3-shape.c3-circle').exists({ count: 19 }, 'has 19 builds');
  });
});
