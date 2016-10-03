import Ember from 'ember';

export default Ember.Controller.extend({
  actions: {
    setJobStatus(id, state) {
      const job = this.store.peekRecord('job', id);

      job.set('state', state);
      job.save();
    },
    removePipeline() {
      this.model.destroyRecord().then(() => {
        this.transitionToRoute('home');
      });
    }
  }
});
