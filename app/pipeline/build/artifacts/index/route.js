import Route from '@ember/routing/route';

export default Route.extend({
  routeAfterAuthentication: 'pipeline.build',
  model() {
    const selectedArtifact = 'manifest.txt';

    this.controllerFor('pipeline.build').set('selectedArtifact', selectedArtifact);

    // return parent route model
    return this.modelFor('pipeline.build');
  },
  actions: {
    didTransition() {
      // delegate to its parent route's didTranstion
      return true;
    }
  }
});
