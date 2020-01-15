import Route from '@ember/routing/route';

export default Route.extend({
  routeAfterAuthentication: 'pipeline.build',
  model(params) {
    this.controllerFor('pipeline.build').set('preselectedStepName', params.step_id);
    this.controllerFor('pipeline.build').set('selectedArtifact', 'manifest.txt');

    // return parent route model
    return this.modelFor('pipeline.build');
  },
  afterModel(model) {
    if (!model) {
      return;
    }

    const stepName = this.controllerFor('pipeline.build').get('preselectedStepName');

    if (!model.build.get('steps').findBy('name', stepName)) {
      this.transitionTo('pipeline.build', model.pipeline.get('id'), model.build.get('id'));
    }
  },

  actions: {
    didTransition() {
      // delegate to its parent route's didTranstion
      return true;
    }
  }
});
