import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';

export default class PipelineJobsTableCellMetricsComponent extends Component {
  @tracked latestBuild;

  constructor() {
    super(...arguments);

    const { job } = this.args.record;

    this.args.record.onCreate(job, builds => {
      if (builds.length > 0) {
        this.latestBuild = builds[builds.length - 1];
      }
    });
  }

  willDestroy() {
    super.willDestroy();

    this.args.record.onDestroy(this.args.record.job);
  }
}
