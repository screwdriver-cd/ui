import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import humanizeDuration from 'humanize-duration';

export default class PipelineSettingsJobsTableCellDateComponent extends Component {
  @tracked date;

  intervalId;

  constructor() {
    super(...arguments);

    if (this.args.record.date) {
      this.getDurationText();
      this.startInterval();
    } else {
      this.date = null;
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
      this.getDurationText();
    }, 1000);
  }

  getDurationText() {
    const { date } = this.args.record;

    this.date = `${humanizeDuration(Date.now() - new Date(date), {
      round: true,
      largest: 1
    })} ago`;
  }
}
