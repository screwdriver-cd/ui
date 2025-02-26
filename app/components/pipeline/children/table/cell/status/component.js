import Component from '@glimmer/component';
import _ from 'lodash';
import { getStateIcon } from 'screwdriver-ui/utils/pipeline';

export default class PipelineChildrenTableCellStatusComponent extends Component {
  icon;

  state;

  constructor() {
    super(...arguments);

    this.icon = getStateIcon(this.args.record.state);

    // eslint-disable-next-line ember/no-string-prototype-extensions
    this.state = _.capitalize(this.args.record.state);
  }
}
