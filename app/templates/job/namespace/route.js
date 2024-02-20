import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';

export default Route.extend({
  template: service(),
  templateName: 'templates/index',
  setupController(controller, model) {
    this._super(controller, model);
    controller.set(
      'targetNamespace',
      this.paramsFor('templates.namespace').namespace
    );
  },
  model(params) {
    return this.template.getAllTemplates(params.namespace);
  }
});
