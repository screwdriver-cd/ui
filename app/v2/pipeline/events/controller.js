import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';
import { get, action } from '@ember/object';
import groupBy from 'lodash.groupby';
import moment from 'moment';

export default class NewPipelineEventsController extends Controller {
  pipelineId;

  @tracked selectedEventId;

  @tracked events;

  @tracked isExpanded = false;

  @action
  toggleExpanded() {
    if (this.showHideEventsList) {
      this.showHideEventsList();
      this.isExpanded = !this.isExpanded;
    }
  }

  get isGroupedEvents() {
    const isGroupedEvents =
      get(this, 'pipeline.settings.groupedEvents') === undefined
        ? true
        : get(this, 'pipeline.settings.groupedEvents');

    return isGroupedEvents;
  }

  get groupedEvents() {
    const { events } = this;
    const groups = groupBy(events.toArray(), 'groupEventId');
    const groupsArray = Object.keys(groups).map(key => groups[key]);

    groupsArray.forEach(arr =>
      arr.sort(
        (a, b) =>
          moment(b.createTime).valueOf() - moment(a.createTime).valueOf()
      )
    );
    groupsArray.sort(
      (a, b) =>
        moment(b[0].createTime).valueOf() - moment(a[0].createTime).valueOf()
    );

    return groupsArray;
  }

  get lastSuccessful() {
    const list = this.events || [];
    const event = list.find(e => e.status === 'SUCCESS');

    if (!event) {
      return 0;
    }

    return event.id;
  }
}
