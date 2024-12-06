import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { statusIcon } from 'screwdriver-ui/utils/build';

export default class PipelineJobsTableCellJobComponent extends Component {
  @tracked latestBuild;

  @tracked statusIcon;

  constructor() {
    super(...arguments);

    const { job } = this.args.record;

    this.args.record.onCreate(job, builds => {
      if (builds.length > 0) {
        this.latestBuild = builds[builds.length - 1];
        this.statusIcon = statusIcon(this.latestBuild.status);
      }
    });
  }

  willDestroy() {
    super.willDestroy();

    this.args.record.onDestroy(this.args.record.job);
  }
}
