import Route from '@ember/routing/route';
import { service } from '@ember/service';
import { action } from '@ember/object';

export default class NewPipelineRoute extends Route {
  @service router;

  @service shuttle;

  @service store;

  async model(params) {
    const collections = this.store.findAll('collection').catch(() => []);

    const pipeline = await this.shuttle
      .fetchFromApi('get', `/pipelines/${params.pipeline_id}`)
      .catch(() => null);

    return {
      collections,
      pipeline
    };
  }

  afterModel(model) {
    if (!model.pipeline) {
      this.router.replaceWith('/404');
    }
  }

  setupController(controller, model) {
    super.setupController(controller, model);
    controller.set('showHideEventsList', this.showHideEventsList.bind(this));
    console.log(controller);
  }

  @action
  showHideEventsList() {
    let pipelineController = this.controllerFor('v2.pipeline');

    pipelineController.set('isExpanded', !pipelineController.isExpanded);
  }
}
