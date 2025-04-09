import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class NewPipelineRoute extends Route {
  @service shuttle;

  @service banners;

  @service pipelinePageState;

  async model(params) {
    const pipelineId = params.pipeline_id;

    this.pipelinePageState.clear();

    const pipeline = await this.shuttle
      .fetchFromApi('get', `/pipelines/${pipelineId}`)
      .then(response => {
        this.pipelinePageState.setPipeline(response);

        return response;
      })
      .catch(() => {
        this.replaceWith('/404');

        return null;
      });

    if (!pipeline) {
      return null;
    }

    await this.banners.getPipelineBanners(pipelineId);

    return {
      pipeline
    };
  }

  deactivate() {
    this.banners.getGlobalBanners().then(() => {});
  }
}
