import Route from '@ember/routing/route';

export default Route.extend({
  model() {
    // return parent route model
    return this.modelFor('pipeline.job-latest-build');
  },
  afterModel(model) {
    if (!model) return;
    const { id: buildId, pipelineId } = model;
    const filePath = this.paramsFor(this.routeName).file_path;

    this.transitionTo(
      'pipeline.build.artifacts.detail',
      pipelineId,
      buildId,
      filePath
    );
  }
});
