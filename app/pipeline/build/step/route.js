import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default Route.extend({
  router: service(),
  routeAfterAuthentication: 'pipeline.build',
  model(params) {
    this.controllerFor('pipeline.build').set(
      'preselectedStepName',
      params.step_id
    );

    // return parent route model
    return this.modelFor('pipeline.build');
  },
  afterModel(model) {
    if (!model) {
      return;
    }

    const stepName = this.controllerFor('pipeline.build').get(
      'preselectedStepName'
    );

    if (!model.build.get('steps').findBy('name', stepName)) {
      this.router.transitionTo(
        'pipeline.build',
        model.pipeline.get('id'),
        model.build.get('id')
      );
    }
  },

  actions: {
    didTransition() {
      this.controllerFor('pipeline.build').setProperties({
        selectedArtifact: '',
        activeTab: 'steps'
      });
    }
  }
});
