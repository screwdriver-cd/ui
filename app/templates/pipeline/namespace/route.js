import Route from '@ember/routing/route';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';
import { service } from '@ember/service';

export default class TemplatesPipelineNamespaceRoute extends Route.extend(
  AuthenticatedRouteMixin
) {
  @service template;

  templateName = 'templates/index';

  model(params) {
    this.routeParams = params;

    return this.template.getAllTemplates(params.namespace);
  }

  setupController(controller, model) {
    // Call _super for default behavior
    super.setupController(controller, model);

    // Implement your custom setup after
    controller.set('routeParams', this.routeParams);

    controller.set(
      'targetNamespace',
      this.paramsFor('templates.namespace').namespace
    );
  }
}
