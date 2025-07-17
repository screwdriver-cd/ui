import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';
import { toCustomLocaleString } from 'screwdriver-ui/utils/time-range';

export default class PipelineJobsTableCellStartTimeComponent extends Component {
  @service('settings') settings;

  @tracked latestBuild;

  get startTime() {
    const { build } = this.args.record;

    if (!build) {
      return null;
    }
    if (!build.startTime) {
      return 'Not started';
    }

    if (this.settings.getSettings().timestampFormat === 'UTC') {
      return toCustomLocaleString(new Date(build.startTime), {
        timeZone: 'UTC'
      });
    }

    return toCustomLocaleString(new Date(build.startTime));
  }
}
