import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';

export default class PipelineJobsTableCellHistoryComponent extends Component {
  @tracked latestBuilds;

  constructor() {
    super(...arguments);

    const { job } = this.args.record;

    this.args.record.onCreate(job, builds => {
      if (builds.length > 0) {
        this.latestBuilds = builds;
      }
    });
  }

  willDestroy() {
    super.willDestroy();

    this.args.record.onDestroy(this.args.record.job);
  }

  truncateSha(build) {
    return build.meta.build.sha.slice(0, 7);
  }
}
