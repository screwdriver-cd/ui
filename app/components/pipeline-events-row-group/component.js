import { computed, get, set } from '@ember/object';
import Component from '@ember/component';

export default Component.extend({
  events: [],
  isExpanded: computed('expandedEventsGroup', 'events.[]', {
    get() {
      const expandedGroups = get(this, 'expandedEventsGroup');
      const { groupEventId } = this.events[0];

      return !!expandedGroups[groupEventId];
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
