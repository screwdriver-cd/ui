import Ember from 'ember';

export default Ember.Route.extend({
  beforeModel() {
    this.set('pipeline', this.modelFor('pipeline'));
  },
  model() {
    return this.get('pipeline.secrets').then(s => ({ secrets: s, pipeline: this.get('pipeline') }));
  }
});
