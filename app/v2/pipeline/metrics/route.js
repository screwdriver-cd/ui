import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class NewPipelineMetricsRoute extends Route {
  @service('pipeline-page-state') pipelinePageState;

  beforeModel(transition) {
    this.pipelinePageState.setRoute(this.routeName);
    this.pipelinePageState.forceReloadPipelineHeader();

    this.replaceWith(
      'pipeline.metrics',
      transition.to.parent.params.pipeline_id
    );
  }
}
