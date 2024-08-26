import Route from '@ember/routing/route';
import { service } from '@ember/service';
import { set } from '@ember/object';

export default class NewPipelineRoute extends Route {
  @service router;

  @service shuttle;

  async model(params) {
    set(this, 'pipelineId', params.pipeline_id);
    const pipeline = await this.shuttle
      .fetchFromApi('get', `/pipelines/${params.pipeline_id}`)
      .catch(() => null);

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
