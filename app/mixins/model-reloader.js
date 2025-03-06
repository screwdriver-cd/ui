import { later, cancel } from '@ember/runloop';
import Mixin from '@ember/object/mixin';
import ENV from 'screwdriver-ui/config/environment';

export const SHOULD_RELOAD_NO = 'NO';
export const SHOULD_RELOAD_YES = 'YES';
export const SHOULD_RELOAD_SKIP = 'SKIP';

export default Mixin.create({
  /**
   * Parameter to indicate reloading is paused
   */
  isPaused: false,
  runLater: 0,
  /**
   * Schedules reload of events data
   * @method scheduleReload
   */
  scheduleReload() {
    // The testing environment waits for asyncronous operations to complete.
    // If the reloader is active during tests, the tests will always timeout.
    // I'm not sure of a better way to handle this
    if (ENV.environment !== 'test') {
      const runLater = later(this, 'reloadModel', this.reloadTimeout);

      this.set('runLater', runLater);
    }
  },

  /**
   * Reloads the list of events
   * @method reloadEvents
   */
  reloadModel() {
    const { modelToReload, additionalModelToReload } = this;

    let model;

    // Let Controller provide a reload() to refresh it's dependencies
    if (!modelToReload && typeof this.reload === 'function') {
      model = this;
    } else {
      model = this.get(modelToReload);
    }

    const shouldReload = this.shouldReload(model);

    if (!model) {
      return;
    }

    if (this.isPaused) {
      this.scheduleReload();

      return;
    }

    const modelReloadPromises = [];

    switch (shouldReload) {
      case SHOULD_RELOAD_YES:
        if (!window.navigator.onLine) {
          break;
        }

        modelReloadPromises.push(
          model.reload().then(() => {
            if (model.model && model.model.reload) {
              model.model.reload();
            }
          })
        );

        if (additionalModelToReload) {
          const additionalModel = this.get(additionalModelToReload);

          if (additionalModel) {
            const shouldReloadAdditionalModel =
              this.shouldReloadAdditionalModel(additionalModel);

            if (shouldReloadAdditionalModel) {
              modelReloadPromises.push(
                additionalModel.reload().then(() => {
                  if (additionalModel.model && additionalModel.model.reload) {
                    additionalModel.model.reload();
                  }
                })
              );
            }
          }
        }

        Promise.all(modelReloadPromises).finally(() => this.scheduleReload());
        break;
      case SHOULD_RELOAD_SKIP:
        this.scheduleReload();
        break;
      default:
        break;
    }
  },

  /**
   * Starts reloading if not already doing so
   * @method startReloading
   */
  startReloading() {
    if (!this.runLater) {
      this.scheduleReload();
    }
  },

  /**
   * Stops reloading
   * @method stopReloading
   */
  stopReloading() {
    if (this.runLater) {
      cancel(this.runLater);
      this.set('runLater', null);
    }
  },

  /**
   * Forces model reload
   * @method forceReload
   */
  forceReload() {
    cancel(this.runLater);
    // Push this reload out of current run loop.
    const forceLater = later(this, 'reloadModel', ENV.APP.FORCE_RELOAD_WAIT);

    this.set('runLater', forceLater);
  }
});
