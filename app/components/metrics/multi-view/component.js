import Component from '@glimmer/component';
import { action } from '@ember/object';

export default class MetricsMultiViewComponent extends Component {
  size = 'small';

  theme = 'material';

  chart = null;

  value = [];

  showLabels = true;

  offLabel = null;

  onLabel = 'This is a label';

  @action
  onToggle(target) {
    this.handleToggle(target);
  }
}
