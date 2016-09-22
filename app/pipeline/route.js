import Ember from 'ember';

export default Ember.Route.extend({
  titleToken(model) {
    return model.get('appId');
  },
  model(params) {
    return this.get('store').findRecord('pipeline', params.pipeline_id);
  }
});
