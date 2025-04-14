import Component from '@glimmer/component';
import getStageName from './util';

export default class PipelineJobsTableCellStageComponent extends Component {
  get stageName() {
    return getStageName(this.args.record.job);
  }
}
