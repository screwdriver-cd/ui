import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { toCustomLocaleString } from 'screwdriver-ui/utils/time-range';

export default class PipelineJobsTableCellStartTimeComponent extends Component {
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

  get startTime() {
    if (!this.latestBuild) {
      return null;
    }
    if (!this.latestBuild.startTime) {
      return 'Not started';
    }

    if (this.args.record.timestampFormat === 'UTC') {
      return toCustomLocaleString(new Date(this.latestBuild.startTime), {
        timeZone: 'UTC'
      });
    }

    return toCustomLocaleString(new Date(this.latestBuild.startTime));
  }
}
