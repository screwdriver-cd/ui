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

  get tooltips() {
    return this.args.tooltips || 'tooltips';
  }

  get legends() {
    return this.args.legends || 'legends';
  }

  get onresized() {
    return this.args.onresized(...arguments);
  }

  get onrendered() {
    return this.args.onrendered(...arguments);
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
