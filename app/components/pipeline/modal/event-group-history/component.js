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

  @action
  fetchGroupEvents() {
    this.shuttle
      .fetchFromApi(
        'get',
        `/pipelines/${this.args.pipeline.id}/events?groupEventId=${this.args.event.groupEventId}`
      )
      .then(events => {
        if (this.events.length < events.length) {
          this.events = events;
        }
      });
  }
}
