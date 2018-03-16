import Route from '@ember/routing/route';

export default Route.extend({
  routeAfterAuthentication: 'pipeline.options',
  model() {
    const pipeline = this.modelFor('pipeline');

    // Prevent double render when jobs list updates asynchronously
    return pipeline.get('jobs').then(jobs => ({ pipeline, jobs }));
  }
});
