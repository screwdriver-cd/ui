import Route from '@ember/routing/route';

export default class NewPipelineMetricsRoute extends Route {
  beforeModel(transition) {
    const id = transition.to.parent.params.pipeline_id;

    // redirect to the v1 pipeline metrics page
    this.transitionTo('pipeline.metrics', id);
  }
}
