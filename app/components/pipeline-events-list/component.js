import { computed, get, set } from '@ember/object';
import Component from '@ember/component';
import { inject as service } from '@ember/service';

export default Component.extend({
  eventsService: service('events'),
  errorMessage: '',
  showMore: computed('moreToShow', {
    get() {
      return get(this, 'moreToShow');
    }
  }),

  eventsList: computed('events.[]', {
    get() {
      console.log('events: ', get(this, 'events'));

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
