import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class NewPipelineIndexRoute extends Route {
  @service
  router;

  beforeModel() {
    const { pipeline } = this.modelFor('v2.pipeline');

    if (pipeline.childPipelines) {
      this.router.transitionTo('pipeline.child-pipelines');
    } else {
      this.router.transitionTo('v2.pipeline.events');
    }
  }

  /* eslint-disable camelcase */
  model(/* { pipeline_id } */) {
    return this;
  }
  /* eslint-enable camelcase */
}
