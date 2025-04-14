import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import humanizeDuration from 'humanize-duration';
import { unfinishedStatuses } from 'screwdriver-ui/utils/build';

export default class PipelineJobsTableCellDurationComponent extends Component {
  @tracked duration;

  buildDuration;

  intervalId;

  humanizeConfig = {
    round: true,
    delimiter: ' ',
    spacer: '',
    units: ['h', 'm', 's'],
    language: 'shortEn',
    languages: {
      shortEn: { h: () => 'h', m: () => 'm', s: () => 's' }
    }
  };

  constructor() {
    super(...arguments);

    const { build } = this.args.record;

    if (build) {
      const startTime = Date.parse(build.startTime);

      if (build.endTime) {
        this.duration = humanizeDuration(
          Date.parse(build.endTime) - startTime,
          this.humanizeConfig
        );
      } else if (unfinishedStatuses.includes(build.status)) {
        if (build.status === 'RUNNING') {
          this.buildDuration = new Date() - startTime;
          this.duration = this.getRunningDurationText();

          this.startInterval();
        } else {
          this.duration = '';
        }
      } else {
        this.duration = 'N/A';
      }
    }
  }

  willDestroy() {
    super.willDestroy();

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  startInterval() {
    this.intervalId = setInterval(() => {
      this.buildDuration += 1000;
      this.duration = this.getRunningDurationText();
    }, 1000);
  }

  getRunningDurationText() {
    return `Running for ${humanizeDuration(
      this.buildDuration,
      this.humanizeConfig
    )}`;
  }
}
