import Route from '@ember/routing/route';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';
import { inject as service } from '@ember/service';

export default class TemplatesCatchAllRoute extends Route.extend(
  AuthenticatedRouteMixin
) {
  @service router;

  redirect(model, transition) {
    // backward compatibility:
    // 1) /templates/namespace to /templates/job/namespace
    // 2) /templates/namespace/name to /templates/job/namespace/name
    if (transition.to?.name === 'templates.catch-all') {
      this.router.transitionTo(`/templates/job/${model.path}`);
    }
  }
}
