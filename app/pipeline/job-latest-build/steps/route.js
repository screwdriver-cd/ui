import Route from '@ember/routing/route';

export default Route.extend({
  model() {
    // return parent route model
    return this.modelFor('pipeline.job-latest-build');
  },
  afterModel(model) {
    if (!model) return;
    const { id: buildId, pipelineId } = model;
    const stepId = this.paramsFor(this.routeName).step_id;

    this.transitionTo('pipeline.build.step', pipelineId, buildId, stepId);
  }
});
