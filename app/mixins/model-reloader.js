import { later, cancel } from '@ember/runloop';
import Mixin from '@ember/object/mixin';
import ENV from 'screwdriver-ui/config/environment';

export default Mixin.create({
  /**
   * Overridable function to determine if a model should be reloaded
   * @method shouldReload
   * @param {Object}    model  The model that is to be reloaded
   * @return {Boolean}          True is model should be reloaded
   */
  shouldReload() {
    return this.get('runLater');
  },
  /**
   * Schedules reload of events data
   * @method scheduleReload
   */
  scheduleReload() {
    // The testing environment waits for asyncronous operations to complete.
    // If the reloader is active during tests, the tests will always timeout.
    // I'm not sure of a better way to handle this
    if (ENV.environment !== 'test') {
      const runLater = later(this, 'reloadModel', this.get('reloadTimeout'));

      this.set('runLater', runLater);
    }
  },

  /**
   * Reloads the list of events
   * @method reloadEvents
   */
  reloadModel() {
    const modelToReload = this.get('modelToReload');
    let model;

    // Let Controller provide a reload() to refresh it's dependencies
    if (!modelToReload && typeof this.reload === 'function') {
      model = this;
    } else {
      model = this.get(modelToReload);
    }

    if (model) {
      if (this.shouldReload(model)) {
        model.reload().finally(() => this.scheduleReload());
      } else if (this.get('isPaused')) {
        this.scheduleReload();
      }
    }
  },

  /**
   * Starts reloading if not already doing so
   * @method startReloading
   */
  startReloading() {
    if (!this.get('runLater')) {
      this.scheduleReload();
    }
  },

  /**
   * Stops reloading
   * @method stopReloading
   */
  stopReloading() {
    if (this.get('runLater')) {
      cancel(this.get('runLater'));
      this.set('runLater', null);
    }
  },

  /**
   * Forces model reload
   * @method forceReload
   */
  forceReload() {
    cancel(this.get('runLater'));
    // Push this reload out of current run loop.
    const forceLater = later(this, 'reloadModel', ENV.APP.FORCE_RELOAD_WAIT);

    this.set('runLater', forceLater);
  }
});
