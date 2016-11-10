import Ember from 'ember';

export default Ember.Controller.extend({
  isSaving: false,
  errorMessage: '',
  saveSuccess: false,

  actions: {
    createPipeline(scmUrl) {
      let pipeline = this.store.createRecord('pipeline', { checkoutUrl: scmUrl });

      this.set('isSaving', true);

      pipeline.save()
        .then(() => {
          this.set('saveSuccess', true);
          this.transitionToRoute('pipeline', pipeline.get('id'));
        }, (err) => {
          this.set('errorMessage', err.errors.message);
        }).finally(() => {
          this.set('isSaving', false);
        });
    }
  }
});
