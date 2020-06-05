/* eslint-disable ember/alias-model-in-controller */
// The route for this controller does not expose a model to alias.
import Controller from '@ember/controller';

export default Controller.extend({
  isSaving: false,
  errorMessage: '',
  showQuickStartGuide: false,
  templates: [],
  actions: {
    createPipeline({ scmUrl, rootDir, files }) {
      let payload = {
        checkoutUrl: scmUrl,
        rootDir,
        files,
        scmUri: scmUrl,
        title: 'onboard to screwdriver',
        message: 'add screwdriver.yaml file'
      };

      let pipeline = this.store.createRecord('pipeline', payload);

      this.set('isSaving', true);

      pipeline
        .save()
        .then(
          () => {
            this.transitionToRoute('pipeline', pipeline.get('id'));
          },
          err => {
            let error = err.errors[0] || {};

            if (error.status === 409 && typeof error.data === 'object' && error.data.existingId) {
              this.transitionToRoute('pipeline', error.data.existingId);
            } else {
              this.set('errorMessage', error.detail);
            }
          }
        )
        .finally(() => {
          this.set('isSaving', false);
        });
    }
  }
});
