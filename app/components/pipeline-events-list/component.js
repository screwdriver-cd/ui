import { computed } from '@ember/object';
import { sort } from '@ember/object/computed';
import Component from '@ember/component';
import ENV from 'screwdriver-ui/config/environment';
import ModelReloaderMixin from 'screwdriver-ui/mixins/model-reloader';

export default Component.extend(ModelReloaderMixin, {
  modelToReload: 'events',
  reloadTimeout: ENV.APP.EVENT_RELOAD_TIMER,
  showAll: false,
  eventsSorted: sort('events.[]',
    (a, b) => parseInt(b.id, 10) - parseInt(a.id, 10)),

  /**
   * Runs when a render event is triggered, usually due to a change in attribute data (events)
   * @method willRender
   */
  willRender() {
    this.startReloading();
  },

  /**
   * Executes when the component is about to be destroyed
   * @method willDestroy
   */
  willDestroy() {
    this.stopReloading();
  },

  eventsToView: computed('events.[]', 'showAll', {
    get() {
      const numEvents = this.get('events.length');
      const end = numEvents >= ENV.APP.NUM_EVENTS_LISTED && !this.get('showAll') ?
        ENV.APP.NUM_EVENTS_LISTED : numEvents;

      return this.get('eventsSorted').slice(0, end);
    }
  }),

  actions: {
    showAllEvents() {
      this.set('showAll', true);
    }
  }
});
