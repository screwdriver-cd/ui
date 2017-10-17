import Route from '@ember/routing/route';

export default Route.extend({
  routeAfterAuthentication: 'pipeline',
  titleToken(model) {
    return model.get('appId');
  },
  model(params) {
    this.set('pipelineId', params.pipeline_id);

    return this.get('store').findRecord('pipeline', params.pipeline_id);
  },

  actions: {
    error(reason) {
      this.transitionTo('page-not-found', { path: `pipelines/${this.get('pipelineId')}`, reason });
    }
  }
});
