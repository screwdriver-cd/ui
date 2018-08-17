import { computed, get, set } from '@ember/object';
import Component from '@ember/component';

export default Component.extend({
  errorMessage: '',
  showMore: computed('moreToShow', {
    get() {
      return get(this, 'moreToShow');
    }
  }),
  eventsList: computed('events.[]', {
    get() {
      return get(this, 'events');
    }
  }),

  init() {
    this._super(...arguments);

    set(this, 'eventsPage', 1);
  },

  actions: {
    moreClick() {
      const eventsPage = get(this, 'eventsPage') + 1;
      const fn = get(this, 'updateEvents');

      set(this, 'eventsPage', eventsPage);

      if (typeof fn === 'function') {
        fn(eventsPage).catch(error => this.set('errorMessage', error));
      }
    },
    eventClick(id) {
      set(this, 'selected', id);
    }
  }
});
