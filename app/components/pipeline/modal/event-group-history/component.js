import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';
import ENV from 'screwdriver-ui/config/environment';

export default class PipelineModalEventGroupHistoryComponent extends Component {
  @service shuttle;

  @tracked events = [];

  intervalId;

  constructor() {
    super(...arguments);

    this.fetchGroupEvents();
    this.intervalId = setInterval(
      () => this.fetchGroupEvents(),
      ENV.APP.BUILD_RELOAD_TIMER
    );
  }

  willDestroy() {
    super.willDestroy();

    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  get modalHeaderText() {
    if (this.args.isPR) {
      return `Events in PR: ${this.args.event.prNum}`;
    }

    return `Events in group: ${this.args.event.groupEventId}`;
  }

  @action
  fetchGroupEvents() {
    const baseUrl = `/pipelines/${this.args.pipeline.id}/events?`;
    const url = this.args.isPR
      ? `${baseUrl}prNum=${this.args.event.prNum}`
      : `${baseUrl}groupEventId=${this.args.event.groupEventId}`;

    this.shuttle.fetchFromApi('get', url).then(events => {
      if (this.events.length < events.length) {
        this.events = events;
      }
    });
  }
}
