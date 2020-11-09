import Component from '@glimmer/component';
import { action } from '@ember/object';

export default class MetricsChartComponent extends Component {
  get chartTitle() {
    return this.args.chartTitle || 'chartTitle';
  }

  get chartName() {
    return this.args.chartName || 'ChartName';
  }

  get dependentChartNames() {
    return this.args.dependentChartNames || [];
  }

  get axis() {
    return this.args.axis || 'axis';
  }

  get metrics() {
    return this.args.metrics || 'metrics';
  }

  get tooltip() {
    return this.args.tooltip || 'tooltip';
  }

  get legends() {
    return this.args.legends || 'legends';
  }

  get onresized() {
    if (this.args.onresized) {
      this.args.onresized(...arguments);
    }

    return () => {};
  }

  get onrendered() {
    if (this.args.onrendered) {
      return this.args.onrendered(...arguments);
    }

    return () => {};
  }

  @action
  onLegendHoverOut(/* chartName */) {
    this.args.onLegendHoverOut(...arguments);
  }

  @action
  onLegendClick(/* key, chartName, { currentTarget, target } */) {
    this.args.onLegendClick(...arguments);
  }

  @action
  onLegendHover(/* key, chartName */) {
    this.args.onLegendHover(...arguments);
  }

  @action
  resetZoom(chartName, dependentChartNames) {
    this.args.resetZoom(chartName, dependentChartNames);
  }
}
