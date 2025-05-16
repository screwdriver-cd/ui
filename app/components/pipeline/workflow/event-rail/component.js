import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';
import ENV from 'screwdriver-ui/config/environment';

const EVENT_BATCH_SIZE = 10;

export default class PipelineWorkflowEventRailComponent extends Component {
  @service('shuttle') shuttle;

  @service('workflow-data-reload') workflowDataReload;

  @service('pipeline-page-state') pipelinePageState;

  @tracked showSearchEventModal = false;

  @tracked showStartEventModal = false;

  @tracked showSyncPrModal = false;

  @tracked events;

  @tracked firstItemId;

  @tracked showCards = false;

  collectionApi;

  prNums;

  newestEvent = null;

  oldestEvent = null;

  intervalId = null;

  constructor() {
    super(...arguments);

    this.prNums = this.args.prNums;
  }

  willDestroy() {
    super.willDestroy();

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  get isPR() {
    return this.pipelinePageState.getIsPr();
  }

  get eventType() {
    return this.isPR ? 'pr' : 'pipeline';
  }

  @action
  async initialize() {
    const { event } = this.args;

    if (event) {
      await this.fetchNeighborEvents(event).then(() => {
        this.firstItemId = String(event.id);
        this.showCards = true;
      });
    }
  }

  @action
  update(element, [event, reloadEvents]) {
    if (reloadEvents) {
      this.oldestEvent = null;

      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }

      this.fetchNeighborEvents(event).then(index => {
        setTimeout(() => {
          this.collectionApi?.scrollToItem(index);
        }, 100);
      });
    }
  }

  async fetchNeighborEvents(event) {
    if (!event) {
      return Promise.resolve();
    }

    return Promise.all([
      this.fetchNewerEvents(event),
      this.fetchOlderEvents(event)
    ]).then(([newerEvents, olderEvents]) => {
      this.events = [...newerEvents, event, ...olderEvents];
      this.newestEvent = this.events[0];

      return newerEvents.length;
    });
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

      if (index === -1) {
        return [];
      }

      const prNums = openPrNums.slice(index + 1, index + 1 + EVENT_BATCH_SIZE);

      const promises = prNums.map(prNumToFetch => {
        return this.shuttle
          .fetchFromApi(
            'get',
            `/pipelines/${pipeline.id}/events?type=${this.eventType}&prNum=${prNumToFetch}`
          )
          .then(events => {
            if (events.length === 0) {
              this.showSyncPrModal = true;
            }

            return events[0];
          });
      });

      return Promise.all(promises).then(events => {
        return events.filter(eventToFilter => !!eventToFilter);
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

  @action
  addNewerEvents(event) {
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

  @action
  addOlderEvents(event) {
    this.fetchOlderEvents(event).then(olderEvents => {
      if (olderEvents.length > 0) {
        this.events = this.events.concat(olderEvents);
      }
    });
  }

  @action
  registerApi(api) {
    this.collectionApi = api;
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

  @action
  closeSyncPrModal() {
    this.showSyncPrModal = false;
  }
}
