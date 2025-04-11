import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { toCustomLocaleString } from 'screwdriver-ui/utils/time-range';

export default class PipelineJobsTableCellStartTimeComponent extends Component {
  @tracked latestBuild;

  get startTime() {
    const { build, timestampFormat } = this.args.record;

    if (!build) {
      return null;
    }
    if (!build.startTime) {
      return 'Not started';
    }

    if (timestampFormat === 'UTC') {
      return toCustomLocaleString(new Date(build.startTime), {
        timeZone: 'UTC'
      });
    }

    return toCustomLocaleString(new Date(build.startTime));
  }
}
