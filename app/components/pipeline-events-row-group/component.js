import { computed, set } from '@ember/object';
import Component from '@ember/component';

export default Component.extend({
  events: [],
  isExpanded: computed('expandedEventsGroup', 'events.[]', {
    get() {
      const expandedGroups = this.expandedEventsGroup;
      const { groupEventId } = this.events[0];

      return !!expandedGroups[groupEventId];
    }
  }),

  actions: {
    toggleExpanded() {
      this.expandedEventsGroup[this.events[0].groupEventId] = !this.isExpanded;
      set(this, 'expandedEventsGroup', { ...this.expandedEventsGroup });
    }
  }
});
