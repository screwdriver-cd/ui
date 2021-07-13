import Component from '@glimmer/component';

export default class MetricsBaseChartComponent extends Component {
    color = {
      // first dozen were from designs, rest from random generator
      pattern: [
        '#87d812',
        '#fed800',
        '#1ac6f4',
        '#6e2ebf',
        '#1f77b4',
        '#aec7e8',
        '#ff7f0e',
        '#2ca02c',
        '#ffbb78',
        '#98df8a',
        '#d62728',
        '#ff9896',
        '#9467bd',
        '#c5b0d5',
        '#8c564b',
        '#c49c94',
        '#e377c2',
        '#f7b6d2',
        '#7f7f7f',
        '#c7c7c7',
        '#bcbd22',
        '#dbdb8d',
        '#17becf',
        '#9edae5',
        '#dd6130',
        '#e0924e',
        '#e0e03e',
        '#29799e',
        '#0ad6d6',
        '#9549d8',
        '#6fc11d',
        '#5dfc5d',
        '#395fa0',
        '#ff60d7',
        '#f907ed',
        '#e5dc2b',
        '#46ceba',
        '#047255',
        '#5bc42b',
        '#ce1296',
        '#efd64a',
        '#4b0cd3',
        '#af3be5',
        '#63ff73',
        '#3e5cb7',
        '#f23eaa',
        '#76259e',
        '#60f2b3',
        '#ddbd1c',
        '#becc2c'
      ]
    };

    size = {
      height: 280
    };

    padding = {
      top: 20
    };

    transition = {
      duration: 300
    };

    interaction = {
      enabled: false
    };

    legend = {
      show: false
    };

    grid = {
      y: {
        show: true
      }
    };

    bar = {
      width: {
        ratio: 0.6
      }
    };

    point = {
      r: 4
    };

    subchart = {
      show: false
    };

    zoom = {
      rescale: true
    };
}
