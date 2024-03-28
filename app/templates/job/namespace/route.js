import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';

export default Route.extend(AuthenticatedRouteMixin, {
  template: service(),

  setupController(controller, model) {
    this._super(controller, model);

    const ctl = this.controllerFor('templates.job.namespace.index');

    ctl.set(
      'targetNamespace',
      this.paramsFor('templates.job.namespace').namespace
    );
  },

  async model(params) {
    const templates = await this.template.getAllTemplates(params.namespace);

    return templates;
  }
});
