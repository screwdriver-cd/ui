import Component from '@glimmer/component';
import { statusIcon } from 'screwdriver-ui/utils/build';

export default class PipelineJobsTableCellJobComponent extends Component {
  get statusIcon() {
    return statusIcon(this.args.record.build.status);
  }
}
