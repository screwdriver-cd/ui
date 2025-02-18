import Route from '@ember/routing/route';

export default class NewPipelineMetricsRoute extends Route {
  beforeModel(transition) {
    this.replaceWith(
      'pipeline.metrics',
      transition.to.parent.params.pipeline_id
    );
  }
}
