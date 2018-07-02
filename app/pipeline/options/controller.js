import Controller from '@ember/controller';
import { reads } from '@ember/object/computed';
import { inject as service } from '@ember/service';

export default Controller.extend({
  session: service(),
  errorMessage: '',
  isSaving: false,
  pipeline: reads('model.pipeline'),
  jobs: reads('model.jobs'),
  actions: {
    setJobStatus(id, state) {
      const job = this.store.peekRecord('job', id);

      job.set('state', state);
      job.save().catch(error => this.set('errorMessage', error.errors[0].detail || {}));
    },
    removePipeline() {
      this.get('pipeline').destroyRecord().then(() => {
        this.transitionToRoute('home');
      }).catch(error => this.set('errorMessage', error.errors[0].detail || {}));
    },
    updatePipeline(scmUrl) {
      let pipeline = this.get('pipeline');

      pipeline.set('checkoutUrl', scmUrl);

      this.set('isSaving', true);

      pipeline.save()
        .then(() => this.set('errorMessage', ''))
        .catch((err) => {
          this.set('errorMessage', err.errors[0].detail || {});
        })
        .finally(() => {
          this.set('isSaving', false);
        });
    }
  }
});
