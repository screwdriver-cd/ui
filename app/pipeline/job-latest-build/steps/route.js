import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default Route.extend({
  router: service(),
  model() {
    // return parent route model
    return this.modelFor('pipeline.job-latest-build');
  },
  afterModel(model) {
    if (!model) return;
    const { id: buildId, pipelineId } = model;
    const stepName = this.paramsFor(this.routeName).step_name;

    this.router.transitionTo(
      'pipeline.build.step',
      pipelineId,
      buildId,
      stepName
    );
  }
});
