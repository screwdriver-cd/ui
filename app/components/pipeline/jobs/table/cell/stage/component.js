import Component from '@glimmer/component';
import getStageName from './util';

export default class PipelineJobsTableCellStageComponent extends Component {
  willDestroy() {
    super.willDestroy();

    this.args.record.onDestroy(this.args.record.job);
  }

  get stageName() {
    return getStageName(this.args.record.job);
  }
}
