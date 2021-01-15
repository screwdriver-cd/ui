import { computed, get, set } from '@ember/object';
import Component from '@ember/component';
import { scheduleOnce } from '@ember/runloop';
import { inject as service } from '@ember/service';
import groupBy from 'lodash.groupby';
import moment from 'moment';

export default Component.extend({
  shuttle: service(),
  router: service(),
  errorMessage: '',
  groups: computed('events.[]', {
    get() {
      this.shuttle.getLatestCommitEvent(this.get('pipeline.id')).then(event => {
        this.set('latestCommit', event);
      });

      const events = get(this, 'events');
      const groups = groupBy(events, 'groupEventId');
      const groupsArray = Object.keys(groups).map(key => groups[key]);

      groupsArray.forEach(arr =>
        arr.sort((a, b) => moment(b.createTime).valueOf() - moment(a.createTime).valueOf())
      );
      groupsArray.sort(
        (a, b) => moment(b[0].createTime).valueOf() - moment(a[0].createTime).valueOf()
      );

      return groupsArray;
    }
  }),
  init() {
    this._super(...arguments);
    scheduleOnce('afterRender', this, 'updateEvents', this.eventsPage + 1);
  },
  actions: {
    eventClick(id, eventType) {
      set(this, 'selected', id);

      if (eventType !== 'pr') {
        const currentEvent = this.groups.find(g => g.find(e => e.id === id))[0];
        const { pipelineId } = currentEvent;
        const expandedEventsGroup = get(this, 'expandedEventsGroup');

        expandedEventsGroup[currentEvent.groupEventId] = true;
        set(this, 'expandedEventsGroup', expandedEventsGroup);

        this.router.transitionTo('pipeline.events.show', pipelineId, id);
      }
    }
  }
});
