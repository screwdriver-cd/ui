import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class NewPipelineIndexRoute extends Route {
  @service router;

  beforeModel() {
    const { pipeline } = this.modelFor('v2.pipeline');

    if (pipeline.childPipelines) {
      this.router.replaceWith('pipeline.child-pipelines');
    } else {
      this.router.replaceWith('v2.pipeline.events');
    }
  }
}
