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
    return true;
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
    const model = this.get(this.get('modelToReload'));

    if (model && this.shouldReload(model)) {
      model.reload().then(() => this.scheduleReload());
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
