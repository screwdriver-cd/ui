import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class MetricsLegendsComponent extends Component {
  /**
   *
   */
  constructor() {
    super(...arguments);
  }

  @action
  onLegendHoverOut(chartName) {
    this.args.onLegendHoverOut(...arguments);
  }

  @action
  onLegendClick(key, chartName, { currentTarget, target }) {
    this.args.onLegendClick(...arguments);
  }

  @action
  onLegendHover(key, chartName) {
    this.args.onLegendHover(...arguments);
  }
}
