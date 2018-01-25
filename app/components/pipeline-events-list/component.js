import { computed, get, set } from '@ember/object';
import { sort } from '@ember/object/computed';
import Component from '@ember/component';
import ENV from 'screwdriver-ui/config/environment';

export default Component.extend({
  modelToReload: 'events',
  showMore: computed('events.length', 'numToShow', {
    get() {
      return get(this, 'numToShow') < get(this, 'events.length');
    }
  }),

  eventsSorted: sort('events.[]',
    (a, b) => parseInt(b.id, 10) - parseInt(a.id, 10)),

  eventsList: computed('events.[]', 'numToShow', {
    get() {
      const numEvents = get(this, 'events.length');
      const desiredNumEvents = get(this, 'numToShow');
      const end = desiredNumEvents <= numEvents ? desiredNumEvents : numEvents;

      return get(this, 'eventsSorted').slice(0, end);
    }
  }),

  init() {
    this._super(...arguments);

    set(this, 'numToShow', ENV.APP.NUM_EVENTS_LISTED);
  },

  actions: {
    moreClick() {
      set(this, 'numToShow', get(this, 'numToShow') + ENV.APP.NUM_EVENTS_LISTED);
    },
    eventClick(id) {
      set(this, 'selected', id);
    }
  }
});
