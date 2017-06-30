import Ember from 'ember';

export default Ember.Controller.extend({
  errorMessage: '',
  isSaving: false,
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
    },
    updatePipeline(scmUrl) {
      let pipeline = this.model;

      pipeline.set('checkoutUrl', scmUrl);

      this.set('isSaving', true);

      pipeline.save()
        .then(() => this.set('errorMessage', ''))
        .catch((err) => {
          this.set('errorMessage', err.errors[0].detail);
        })
        .finally(() => {
          this.set('isSaving', false);
        });
    }
  }
});
