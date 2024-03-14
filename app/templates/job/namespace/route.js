import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';

export default Route.extend(AuthenticatedRouteMixin, {
  template: service(),
  templateName: 'templates/index',
  setupController(controller, model) {
    this._super(controller, model);

    console.log(
      `templates.job.namespace params: ${
        this.paramsFor('templates.job.namespace').namespace
      }`
    );

    controller.set(
      'targetNamespace',
      this.paramsFor('templates.job.namespace').namespace
    );
  },
  model(params) {
    return this.template.getAllTemplates(params.namespace);
  }
});
