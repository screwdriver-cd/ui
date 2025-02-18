import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class NewPipelineRoute extends Route {
  @service shuttle;

  @service pipelinePageState;

  async model(params) {
    const pipelineId = params.pipeline_id;

    this.pipelinePageState.clear();

    const pipeline = await this.shuttle
      .fetchFromApi('get', `/pipelines/${pipelineId}`)
      .then(response => {
        this.pipelinePageState.setPipeline(response);
      })
      .catch(() => {
        this.replaceWith('/404');

        return null;
      });

    if (!pipeline) {
      return null;
    }

    const banners = await this.shuttle
      .fetchBanners('PIPELINE', pipelineId)
      .catch(() => []);

    return {
      pipelineName: pipeline.name,
      banners
    };
  }
}
