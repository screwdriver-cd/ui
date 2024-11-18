import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default class NewPipelineMetricsRoute extends Route {
  @service router; // Ensure router service is injected

  beforeModel(transition) {
    const id = transition.to.parent.params.pipeline_id;
    // Use RouterService to handle redirection

    this.router.transitionTo('pipeline.metrics', id);
  }
}
