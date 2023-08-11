import Route from '@ember/routing/route';

export default class TemplateusageIdRoute extends Route {
  model(params) {
    this.id = params.id;
  }

  setupController(controller, model) {
    // Call _super for default behavior
    super.setupController(controller, model);
    // Implement your custom setup after
    controller.set('id', this.id);
  }
}
