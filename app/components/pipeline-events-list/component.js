import { get, computed, set } from '@ember/object';
import Component from '@ember/component';
import { scheduleOnce } from '@ember/runloop';
import { inject as service } from '@ember/service';
import groupBy from 'lodash.groupby';
import moment from 'moment';

export default Component.extend({
  router: service(),
  shuttle: service(),
  errorMessage: '',
  isGroupedEvents: computed('pipeline.settings.groupedEvents', {
    get() {
      const isGroupedEvents =
        get(this, 'pipeline.settings.groupedEvents') === undefined
          ? true
          : get(this, 'pipeline.settings.groupedEvents');

      return isGroupedEvents;
    }
  }),
  eventsList: computed('events.[]', 'pipeline.id', {
    get() {
      this.shuttle.getLatestCommitEvent(this.get('pipeline.id')).then(event => {
        this.set('latestCommit', event);
      });

      return this.events;
    }
  }),
  groups: computed('events.[]', {
    get() {
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
  }),
  init() {
    this._super(...arguments);

    scheduleOnce('afterRender', this, 'updateEvents', this.eventsPage + 1);
  },
  actions: {
    startPRBuild(parameters) {
      this.startPRBuild.apply(null, [parameters, this.events]);
    },
    stopEvent() {
      this.stopEvent();
    },
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
});
