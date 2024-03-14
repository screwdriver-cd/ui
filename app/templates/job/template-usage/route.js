import Route from '@ember/routing/route';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';

export default class TemplateUsageIdRoute extends Route.extend(
  AuthenticatedRouteMixin
) {
  model(params) {
    this.routeParams = params;
  }

  setupController(controller, model) {
    // Call _super for default behavior
    super.setupController(controller, model);
    // Implement your custom setup after
    controller.set('routeParams', this.routeParams);
  }
}
