import Component from '@glimmer/component';
import { action } from '@ember/object';

export default class MetricsLegendsComponent extends Component {
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
}
