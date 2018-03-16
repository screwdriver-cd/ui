import Route from '@ember/routing/route';

export default Route.extend({
  routeAfterAuthentication: 'pipeline.secrets',
  titleToken: 'Secrets',
  model() {
    const pipeline = this.modelFor('pipeline');

    return pipeline.get('secrets')
      .then(secrets => ({
        secrets,
        pipeline
      }));
  }
});
