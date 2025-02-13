import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class NewPipelineRoute extends Route {
  @service router;

  @service shuttle;

  @service pipelinePageState;

  async model(params) {
    this.pipelinePageState.clear();

    const [pipeline, banners] = await Promise.all([
      this.shuttle
        .fetchFromApi('get', `/pipelines/${params.pipeline_id}`)
        .catch(() => null),
      this.shuttle.fetchBanners('PIPELINE', params.pipeline_id).catch(() => [])
    ]);

    this.pipelinePageState.setPipeline(pipeline);

    return {
      pipeline,
      banners
    };
  }

  afterModel(model) {
    if (!model.pipeline) {
      this.router.replaceWith('/404');
    }
  }
}
