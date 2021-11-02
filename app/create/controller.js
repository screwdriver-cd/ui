import classic from 'ember-classic-decorator';
import { action } from '@ember/object';
/* eslint-disable ember/alias-model-in-controller */
// The route for this controller does not expose a model to alias.
import Controller from '@ember/controller';

@classic
export default class CreateController extends Controller {
  isSaving = false;

  errorMessage = '';

  showQuickStartGuide = false;

  templates = [];

  @action
  createPipeline({ scmUrl, rootDir, autoKeysGeneration }) {
    let payload = { checkoutUrl: scmUrl, rootDir, autoKeysGeneration };

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

          if (
            error.status === 409 &&
            typeof error.data === 'object' &&
            error.data.existingId
          ) {
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
