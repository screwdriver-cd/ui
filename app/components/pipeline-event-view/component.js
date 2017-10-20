import Component from '@ember/component';
import ModelReloaderMixin from 'screwdriver-ui/mixins/model-reloader';
import ENV from 'screwdriver-ui/config/environment';

export default Component.extend(ModelReloaderMixin, {
  modelToReload: 'event.builds',

  willRender() {
    this.startReloading();
  },

  shouldReload() {
    const event = this.get('event');

    if (event) {
      return event.get('isRunning');
    }

    return false;
  },

  willDestroy() {
    this.stopReloading();
  },

  // eslint doesn't know what this property is, so it wants it on the bottom
  reloadTimeout: ENV.APP.EVENT_RELOAD_TIMER
});
