import { computed, get, set } from '@ember/object';
import { sort } from '@ember/object/computed';
import Component from '@ember/component';
import ENV from 'screwdriver-ui/config/environment';
import ModelReloaderMixin from 'screwdriver-ui/mixins/model-reloader';

export default Component.extend(ModelReloaderMixin, {
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

  selectedEvent: computed('events.[]', {
    get() {
      const list = get(this, 'eventsSorted');

      if (Array.isArray(list) && list.length) {
        return get(list[0], 'id');
      }

      return 0;
    }
  }),

  lastSuccessful: computed('events.[]', {
    get() {
      const event = get(this, 'events').find(e => get(e, 'status') === 'SUCCESS');

      if (!event) {
        return 0;
      }

      console.log('hey we got one', get(event, 'id'));

      return get(event, 'id');
    }
  }),

  init() {
    this._super(...arguments);

    set(this, 'numToShow', ENV.APP.NUM_EVENTS_LISTED);
  },

  /**
   * Runs when a render event is triggered, usually due to a change in attribute data (events)
   * @method willRender
   */
  willRender() {
    this.startReloading();
  },

  actions: {
    moreClick() {
      set(this, 'numToShow', get(this, 'numToShow') + ENV.APP.NUM_EVENTS_LISTED);
    },
    eventClick(id) {
      console.log('clicked', id);
      set(this, 'selectedEvent', id);
    }
  },

  /**
   * Executes when the component is about to be destroyed
   * @method willDestroy
   */
  willDestroy() {
    this.stopReloading();
  },

  // eslint doesn't know what this property is, so it wants it at the bottom
  reloadTimeout: ENV.APP.EVENT_RELOAD_TIMER
});
