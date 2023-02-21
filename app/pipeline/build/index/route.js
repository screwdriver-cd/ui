import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

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
    error(error) {
      if (error && Array.isArray(error.errors)) {
        this.router.transitionTo('/404');
      }

      return false;
    }
  }
});
