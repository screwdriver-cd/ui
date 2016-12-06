import Ember from 'ember';
import ENV from 'screwdriver-ui/config/environment';

export default Ember.Route.extend({
  titleToken(model) {
    return model.get('appId');
  },

  model(params) {
    this.set('pipelineId', params.pipeline_id);

    return this.get('store').findRecord('pipeline', params.pipeline_id);
  },

  /**
   * Reload the events list in the pipeline model
   * @method reloadModel
   * @private
   */
  reloadModel() {
    this.modelFor('pipeline').get('events').reload();
  },

  /**
   * After the pipeline loads successfully, set up interval to reload data
   * @method afterModel
   */
  afterModel() {
    if (!this.get('interval')) {
      this.set('interval', setInterval(() => {
        Ember.run.once(this, 'reloadModel');
      }, ENV.APP.EVENT_RELOAD_TIMER));
    }
  },

  /**
   * Clear the interval when the route is going to be destroyed
   * @method willDestroy
   */
  willDestroy(...args) {
    this._super(...args);

    clearInterval(this.get('interval'));
    this.set('interval', null);
  },

  actions: {
    error(reason) {
      this.transitionTo('page-not-found', { path: `pipelines/${this.get('pipelineId')}`, reason });
    }
  }
});
