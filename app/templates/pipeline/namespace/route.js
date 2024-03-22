import Route from '@ember/routing/route';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';
import { inject as service } from '@ember/service';

export default class TemplatesPipelineNamespaceIndexRoute extends Route.extend(
  AuthenticatedRouteMixin
) {
  @service template;

  setupController(controller, model) {
    super.setupController(controller, model);

    const ctl = this.controllerFor('templates.pipeline.namespace.index');

    ctl.set(
      'targetNamespace',
      this.paramsFor('templates.pipeline.namespace').namespace
    );
  }

  async loadAllPipelineTemplates() {
    const pipelineTemplates = await this.template.getAllPipelineTemplates();

    return pipelineTemplates;
  }

  async model() {
    const pipelineTemplates = await this.loadAllPipelineTemplates();

    return pipelineTemplates;
  }
}
