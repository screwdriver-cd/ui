import classic from 'ember-classic-decorator';
import { tagName } from '@ember-decorators/component';
import { inject as service } from '@ember/service';
import { set, action, computed } from '@ember/object';
import Component from '@ember/component';
import { scheduleOnce } from '@ember/runloop';
import groupBy from 'lodash.groupby';
import moment from 'moment';

@classic
@tagName('')
export default class PipelineEventsList extends Component {
  @service
  router;

  @service
  shuttle;

  errorMessage = '';

  @computed('pipeline.settings.groupedEvents')
  get isGroupedEvents() {
    const setting = this.pipeline?.settings?.groupedEvents;

    return setting === undefined ? true : setting;
  }

  @computed('events.[]', 'pipeline.id')
  get eventsList() {
    this.shuttle.getLatestCommitEvent(this.pipeline.id).then(event => {
      this.set('latestCommit', event);
    });

    return this.events;
  }

  @computed('events.[]')
  get groups() {
    const { events } = this;
    const groups = groupBy(events, 'groupEventId');
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

  init() {
    super.init(...arguments);

    scheduleOnce('afterRender', this, 'updateEvents', this.eventsPage + 1);
  }

  @action
  eventClick(id, eventType) {
    set(this, 'selected', id);

    if (eventType !== 'pr') {
      let currentEvent;

      if (this.isGroupedEvents === true) {
        currentEvent = this.groups.find(g => g.find(e => e.id === id))[0];
        const expandedEventsGroup = this.expandedEventsGroup || {};

        expandedEventsGroup[currentEvent.groupEventId] = true;
        set(this, 'expandedEventsGroup', expandedEventsGroup);
      } else {
        currentEvent = this.eventsList.findBy('id', id);
      }

      const { pipelineId } = currentEvent;

      this.router.transitionTo('pipeline.events.show', pipelineId, id);
    }
  }
}
