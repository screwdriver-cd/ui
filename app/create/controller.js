/* eslint-disable ember/alias-model-in-controller */
// The route for this controller does not expose a model to alias.
import Controller from '@ember/controller';
import { inject as service } from '@ember/service';

export default Controller.extend({
  store: service(),
  router: service(),
  isSaving: false,
  errorMessage: '',
  showQuickStartGuide: false,
  templates: [],
  actions: {
    createPipeline({ scmUrl, rootDir, autoKeysGeneration }) {
      const payload = { checkoutUrl: scmUrl, rootDir, autoKeysGeneration };

      const pipeline = this.store.createRecord('pipeline', payload);

      this.set('isSaving', true);

      pipeline
        .save()
        .then(
          () => {
            this.router.transitionTo('pipeline', pipeline.get('id'));
          },
          err => {
            const error = err.errors[0] || {};

            if (
              error.status === 409 &&
              typeof error.data === 'object' &&
              error.data.existingId
            ) {
              this.router.transitionTo('pipeline', error.data.existingId);
            } else {
              this.set('errorMessage', error.detail);
            }
          }
        )
        .finally(() => {
          this.set('isSaving', false);
        });
    },

    goBack(event) {
      event.stopPropagation();
      window.history.back();
    }
  }
});
