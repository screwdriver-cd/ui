import Ember from 'ember';
import ENV from 'screwdriver-ui/config/environment';
import ModelReloaderMixin from 'screwdriver-ui/mixins/model-reloader';

export default Ember.Component.extend(ModelReloaderMixin, {
  modelToReload: 'events',
  reloadTimeout: ENV.APP.EVENT_RELOAD_TIMER,
  showAll: false,
  eventsSorted: Ember.computed.sort('events.[]',
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

  eventsToView: Ember.computed('events.[]', 'showAll', {
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
