import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';

const EVENT_BATCH_SIZE = 10;

export default class PipelineWorkflowEventRailComponent extends Component {
  @service shuttle;

  @service router;

  @service workflowDataReload;

  @tracked showSearchEventModal = false;

  @tracked showStartEventModal = false;

  @tracked events;

  @tracked firstItemId;

  eventType;

  oldestCommitEventId = null;

  constructor() {
    super(...arguments);

    this.eventType = this.router.currentRouteName.includes('events')
      ? 'pipeline'
      : 'pr';

    const { event } = this.args;

    if (event) {
      this.firstItemId = event.id;
      this.events = [event];
    }
  }

  @action
  update(element, [event, reloadEvents]) {
    if (reloadEvents) {
      this.firstItemId = event.id;
      this.events = [event];
    }
  }

  async fetchEvents(eventId, direction) {
    const sort = direction === 'gt' ? 'ascending' : 'descending';

    return this.shuttle
      .fetchFromApi(
        'get',
        `/pipelines/${this.args.pipeline.id}/events?count=${EVENT_BATCH_SIZE}&type=${this.eventType}&id=${direction}:${eventId}&sort=${sort}`
      )
      .then(events => {
        return events;
      });
  }

  @action
  async fetchNewerEvents(event) {
    return this.fetchEvents(event.id, 'gt').then(events => {
      return events.reverse();
    });
  }

  @action
  async fetchOlderEvents(event) {
    if (event.id === this.oldestCommitEventId) {
      return [];
    }

    return this.fetchEvents(event.id, 'lt').then(events => {
      if (events.length < EVENT_BATCH_SIZE) {
        if (events.length === 0) {
          this.oldestCommitEventId = event.id;
        } else {
          this.oldestCommitEventId = events[events.length - 1].id;
        }
      }

      return events;
    });
  }

  @action addNewerEvents(event) {
    this.fetchNewerEvents(event).then(newerEvents => {
      if (newerEvents.length > 0) {
        this.events = newerEvents.concat(this.events);
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
