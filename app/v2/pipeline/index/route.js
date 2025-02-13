import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class NewPipelineIndexRoute extends Route {
  @service router;

  @service pipelinePageState;

  beforeModel() {
    if (this.pipelinePageState.getPipeline().childPipelines) {
      this.router.replaceWith('pipeline.child-pipelines');
    } else {
      this.router.replaceWith('v2.pipeline.events');
    }
  }
}
