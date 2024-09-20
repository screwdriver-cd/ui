import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import humanizeDuration from 'humanize-duration';
import { unfinishedStatuses } from 'screwdriver-ui/utils/build';

export default class PipelineJobsTableCellDurationComponent extends Component {
  @tracked duration;

  latestBuild;

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

    const { job } = this.args.record;

    this.args.record.onCreate(job, builds => {
      if (builds.length > 0) {
        this.latestBuild = builds[builds.length - 1];
        this.initializeBuildDuration();
      }
    });
  }

  willDestroy() {
    super.willDestroy();

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.args.record.onDestroy(this.args.record.job);
  }

  stopInterval() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  startInterval() {
    this.stopInterval();

    this.intervalId = setInterval(() => {
      this.buildDuration += 1000;
      this.duration = this.getRunningDurationText();
    }, 1000);
  }

  initializeBuildDuration() {
    const startTime = Date.parse(this.latestBuild.startTime);

    if (this.latestBuild.endTime) {
      this.duration = humanizeDuration(
        Date.parse(this.latestBuild.endTime) - startTime,
        this.humanizeConfig
      );

      this.stopInterval();
    } else if (unfinishedStatuses.includes(this.latestBuild.status))
      if (this.latestBuild.status === 'RUNNING') {
        this.buildDuration = new Date() - startTime;
        this.duration = this.getRunningDurationText();

        if (!this.intervalId) {
          this.startInterval();
        }
      } else {
        this.duration = '';
      }
    else {
      this.duration = 'N/A';

      this.stopInterval();
    }
  }

  getRunningDurationText() {
    return `Running for ${humanizeDuration(
      this.buildDuration,
      this.humanizeConfig
    )}`;
  }
}
