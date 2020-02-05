import Route from '@ember/routing/route';

export default Route.extend({
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
    }
  }
});
