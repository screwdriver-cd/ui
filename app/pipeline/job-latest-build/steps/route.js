import Route from '@ember/routing/route';

export default Route.extend({
  model() {
    // return parent route model
    return this.modelFor('pipeline.job-latest-build');
  },
  afterModel(model) {
    if (!model) return;
    const { id: buildId, pipelineId } = model;
    const stepName = this.paramsFor(this.routeName).step_name;

    this.transitionTo('pipeline.build.step', pipelineId, buildId, stepName);
  }
});
