import { computed, get, set } from '@ember/object';
import Component from '@ember/component';
import ENV from 'screwdriver-ui/config/environment';
import { inject as service } from '@ember/service';

export default Component.extend({
  eventsService: service('events'),
  showMore: computed('actualPage', 'eventsPage', {
    get() {
      return get(this, 'actualPage') === get(this, 'eventsPage');
    }
  }),

  eventsList: computed('events.[]', 'eventsPage', {
    get() {
      const eventsPage = get(this, 'eventsPage');

      return get(this, 'eventsService').getEvents({
        page: eventsPage,
        count: ENV.APP.NUM_EVENTS_LISTED,
        pipelineId: get(this, 'pipeline.id')
      })
        .then((nextEvents) => {
          if (Array.isArray(nextEvents) && nextEvents.length) {
            set(this, 'actualPage', eventsPage);

            return get(this, 'events').concat(nextEvents);
          }
          set(this, 'actualPage', eventsPage - 1);

          return get(this, 'events');
        });
    }
  }),

  init() {
    this._super(...arguments);

    set(this, 'eventsPage', 1);
    set(this, 'actualPage', 1);
  },

  actions: {
    moreClick() {
      set(this, 'eventsPage', get(this, 'eventsPage') + 1);
    },
    eventClick(id) {
      set(this, 'selected', id);
    }
  }
});
