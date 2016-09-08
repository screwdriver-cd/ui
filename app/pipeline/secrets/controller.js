import Ember from 'ember';

export default Ember.Controller.extend({
  actions: {
    createSecret(name, value, pipelineId) {
      const newSecret = this.store.createRecord('secret', { name, value, pipelineId });

      return newSecret.save();
    }
  }
});
