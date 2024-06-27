import Controller from '@ember/controller';
import { reads } from '@ember/object/computed';
import { inject as service } from '@ember/service';

export default Controller.extend({
  session: service(),
  router: service(),
  errorMessage: '',
  isSaving: false,
  pipeline: reads('model.pipeline'),
  jobs: reads('model.jobs'),
  actions: {
    removePipeline() {
      this.pipeline
        .destroyRecord()
        .then(() => {
          this.router.transitionTo('home');
        })
        .catch(error => this.set('errorMessage', error.errors[0].detail || ''));
    },
    updatePipeline({ scmUrl, rootDir }) {
      const { pipeline } = this;

      pipeline.setProperties({
        checkoutUrl: scmUrl,
        rootDir
      });

      this.set('isSaving', true);

      pipeline
        .save()
        .then(() => this.set('errorMessage', ''))
        .catch(err => {
          this.set('errorMessage', err.errors[0].detail || '');
        })
        .finally(() => {
          this.set('isSaving', false);
        });
    }
  }
});
