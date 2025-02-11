import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class NewPipelineRoute extends Route {
  @service router;

  @service shuttle;

  @service pipelinePageState;

  async model(params) {
    this.pipelinePageState.clear();

    const pipeline = await this.shuttle
      .fetchFromApi('get', `/pipelines/${params.pipeline_id}`)
      .catch(() => null);

    this.pipelinePageState.setPipeline(pipeline);

    return {
      pipeline
    };
  }

  afterModel(model) {
    if (!model.pipeline) {
      this.router.replaceWith('/404');
    }
  }
}
