import { computed, get, set } from '@ember/object';
import Component from '@ember/component';
import { scheduleOnce } from '@ember/runloop';

export default Component.extend({
  errorMessage: '',
  eventsList: computed('events.[]', {
    get() {
      return get(this, 'events');
    }
  }),
  init() {
    this._super(...arguments);
    scheduleOnce('afterRender', this, 'updateEvents', this.eventsPage + 1);
  },
  actions: {
    eventClick(id) {
      set(this, 'selected', id);
    }
  }
});
