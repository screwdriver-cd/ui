import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';

export default class PipelineJobsTableCellStatusComponent extends Component {
  @tracked build;

  constructor() {
    super(...arguments);

    const { job } = this.args.record;

    this.args.record.onCreate(job, builds => {
      if (builds.length > 0) {
        this.build = builds[0];
        this.args.record.status = this.build.status;
      }
    });
  }

  willDestroy() {
    super.willDestroy();

    this.args.record.onDestroy(this.args.record.job);
  }
}
