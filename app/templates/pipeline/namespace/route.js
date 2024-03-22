import Route from '@ember/routing/route';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';
import { inject as service } from '@ember/service';

export default class TemplatesPipelineNamespaceIndexRoute extends Route.extend(
  AuthenticatedRouteMixin
) {
  @service template;

  constructor() {
    super(...arguments);

    console.log('TemplatesPipelineNamespaceIndexRoute');
  }

  setupController(controller, model) {
    this._super(controller, model);

    const ctl = this.controllerFor('templates.pipeline.namespace.index');

    ctl.set(
      'targetNamespace',
      this.paramsFor('templates.pipeline.namespace').namespace
    );
  }

  async loadAllPipelineTemplates() {
    const pipelineTemplates = await this.template.getAllPipelineTemplates();

    console.log('pipelineTemplates', pipelineTemplates);

    return pipelineTemplates;
  }

  async model() {
    console.log('===hererere');

    const pipelineTemplates = await this.loadAllPipelineTemplates();

    console.log('pipelineTemplates', pipelineTemplates);

    return pipelineTemplates;
  }
}
