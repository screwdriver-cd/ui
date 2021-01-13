import { computed, get, set } from '@ember/object';
import Component from '@ember/component';

export default Component.extend({
  events: computed('events.[]', {
    get() {
      return get(this, 'events');
    }
  }),
  isExpanded: computed('expandedEventsGroup', 'events.[]', {
    get() {
      return !!get(this, 'expandedEventsGroup')[this.events[0].groupEventId];
    }
  }),
  init() {
    this._super(...arguments);
  },
  actions: {
    toggleExpanded() {
      this.expandedEventsGroup[this.events[0].groupEventId] = !this.isExpanded;
      set(this, 'expandedEventsGroup', { ...this.expandedEventsGroup });
    }
  }
});
