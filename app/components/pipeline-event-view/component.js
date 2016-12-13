import Ember from 'ember';
import ModelReloaderMixin from 'screwdriver-ui/mixins/model-reloader';
import ENV from 'screwdriver-ui/config/environment';

export default Ember.Component.extend(ModelReloaderMixin, {
  modelToReload: 'event.builds',
  reloadTimeout: ENV.APP.EVENT_RELOAD_TIMER,
  shouldReload() {
    const event = this.get('event');

    if (event) {
      return event.get('isRunning');
    }

    return false;
  },
  willRender() {
    this.startReloading();
  },
  willDestroy() {
    this.stopReloading();
  }
});
