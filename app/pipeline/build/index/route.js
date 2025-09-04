import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { is404, NotFoundError } from '../../../utils/not-found-error';

export default Route.extend({
  router: service(),
  model() {
    // return parent route model
    return this.modelFor('pipeline.build');
  },
  actions: {
    didTransition() {
      this.controllerFor('pipeline.build').setProperties({
        selectedArtifact: '',
        activeTab: 'steps'
      });
    },
    error(error, transition) {
      if ((error && Array.isArray(error.errors)) || is404(error)) {
        transition.abort();
        this.intermediateTransitionTo(
          'error',
          new NotFoundError('Build not found')
        );
      }

      return false;
    }
  }
});
