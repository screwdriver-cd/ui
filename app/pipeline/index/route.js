import Route from '@ember/routing/route';

export default Route.extend({
  routeAfterAuthentication: 'pipeline',
  beforeModel() {
    const pipeline = this.modelFor('pipeline').pipeline;

    if (pipeline.get('childPipelines')) {
      this.transitionTo('pipeline.child-pipelines');
    } else {
      this.transitionTo('pipeline.events');
    }
  }
});
