import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default class NewPipelineMetricsRoute extends Route {
  @service router; // Ensure router service is injected

  beforeModel(transition) {
    this.replaceWith('pipeline.metrics', transition.to.parent.params.pipeline_id);
  }
}
