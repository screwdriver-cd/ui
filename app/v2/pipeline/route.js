import Route from '@ember/routing/route';
import { service } from '@ember/service';
import { NotFoundError } from 'screwdriver-ui/utils/not-found-error';

export default class NewPipelineRoute extends Route {
  @service('shuttle') shuttle;

  @service('banners') banners;

  @service('pipeline-page-state') pipelinePageState;

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
        return Promise.reject(new NotFoundError('Pipeline not found'));
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
