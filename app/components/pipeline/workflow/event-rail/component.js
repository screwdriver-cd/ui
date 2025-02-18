import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';
import ENV from 'screwdriver-ui/config/environment';

const PIPELINE_EVENT = 'pipeline';
const PR_EVENT = 'pr';
const EVENT_BATCH_SIZE = 10;

export default class PipelineWorkflowEventRailComponent extends Component {
  @service shuttle;

  @service router;

  @service workflowDataReload;

  @service pipelinePageState;

  @tracked showSearchEventModal = false;

  @tracked showStartEventModal = false;

  @tracked events;

  @tracked firstItemId;

  eventType;

  prNums;

  newestEvent = null;

  oldestEvent = null;

  intervalId = null;

  constructor() {
    super(...arguments);

    this.eventType = this.router.currentRouteName.includes('events')
      ? PIPELINE_EVENT
      : PR_EVENT;
    this.prNums = this.args.prNums;

    const { event } = this.args;

    if (event) {
      this.firstItemId = event.id;
      this.newestEvent = event;
      this.events = [event];
    }
  }

  willDestroy() {
    super.willDestroy();

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  get isPR() {
    return this.eventType === PR_EVENT;
  }

  @action
  update(element, [event, reloadEvents]) {
    if (reloadEvents) {
      this.firstItemId = event.id;
      this.newestEvent = event;
      this.events = [event];
      this.oldestEvent = null;

      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
    }
  }

  async fetchEvents(event, direction) {
    const pipeline = this.pipelinePageState.getPipeline();

    if (this.isPR) {
      if (!this.prNums || this.prNums.length === 0) {
        return [];
      }

      const openPrNums =
        direction === 'gt' ? this.prNums : this.prNums.toReversed();
      const index = openPrNums.indexOf(event.prNum);
      const prNums = openPrNums.slice(index + 1, index + 1 + EVENT_BATCH_SIZE);

      const promises = prNums.map(prNumToFetch => {
        return this.shuttle
          .fetchFromApi(
            'get',
            `/pipelines/${pipeline.id}/events?type=${this.eventType}&prNum=${prNumToFetch}`
          )
          .then(events => {
            return events[0];
          });
      });

      return Promise.all(promises).then(events => {
        return events;
      });
    }

    const sort = direction === 'gt' ? 'ascending' : 'descending';
    const baseUrl = `/pipelines/${pipeline.id}/events?count=${EVENT_BATCH_SIZE}&type=${this.eventType}&id=${direction}:${event.id}&sort=${sort}`;
    const url = pipeline.settings?.filterSchedulerEvents
      ? `${baseUrl}&creator=ne:sd:scheduler`
      : baseUrl;

    return this.shuttle.fetchFromApi('get', url).then(events => {
      return events;
    });
  }

  @action
  async fetchNewerEvents(event) {
    return this.fetchEvents(event, 'gt').then(events => {
      return events.reverse();
    });
  }

  @action
  async fetchOlderEvents(event) {
    if (event.id === this.oldestEvent?.id) {
      return [];
    }

    return this.fetchEvents(event, 'lt').then(events => {
      if (events.length < EVENT_BATCH_SIZE) {
        if (events.length === 0) {
          this.oldestEvent = event;
        } else {
          this.oldestEvent = events[events.length - 1];
        }
      }

      return events;
    });
  }

  @action addNewerEvents(event) {
    this.fetchNewerEvents(event).then(newerEvents => {
      if (newerEvents.length > 0) {
        this.events = newerEvents.concat(this.events);
        this.newestEvent = newerEvents[0];
      } else if (!this.intervalId) {
        this.intervalId = setInterval(() => {
          if (event.prNum) {
            this.prNums = this.workflowDataReload.getPrNums();
          }

          this.addNewerEvents(this.newestEvent);
        }, ENV.APP.BUILD_RELOAD_TIMER);
      }
    });
  }

  @action addOlderEvents(event) {
    this.fetchOlderEvents(event).then(olderEvents => {
      if (olderEvents.length > 0) {
        this.events = this.events.concat(olderEvents);
      }
    });
  }

  get isSearchDisabled() {
    return !this.events;
  }

  @action
  openSearchEventModal() {
    this.showSearchEventModal = true;
  }

  @action
  closeSearchEventModal() {
    this.showSearchEventModal = false;
  }

  @action
  openStartEventModal() {
    this.showStartEventModal = true;
  }

  @action
  closeStartEventModal() {
    this.showStartEventModal = false;
  }
}
