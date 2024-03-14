import Route from '@ember/routing/route';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';
import { inject as service } from '@ember/service';

export default class TemplatesPipelineDetailIndexRoute extends Route.extend(
  AuthenticatedRouteMixin
) {
  @service template;

  @service router;

  async loadOnePipelineTemplateVersions(namespace, name) {
    const pipelineTemplateVersions =
      await this.template.getPipelineTemplateVersions(namespace, name);

    console.log('pipelineTemplateVersions', pipelineTemplateVersions);

    return pipelineTemplateVersions;
  }

  async model() {
    const pipelineDetailsParams = this.paramsFor('templates.pipeline.detail');
    const { namespace, name } = pipelineDetailsParams;

    console.log('pipelineDetailsParams', pipelineDetailsParams);

    const pipelineTemplateVersions = await this.loadOnePipelineTemplateVersions(
      namespace,
      name
    );

    return pipelineTemplateVersions;
    // return false;
    // return true;
  }

  async setupController(controller, model) {
    const pipelineName = model;
    const workflowGraph = undefined; 
    const annotations = undefined; 
    const parameters = undefined; 

    this.controllerFor('templates.detail').setProperties({
      pipelineName,
      workflowGraph, 
      annotations,
      parameters,
      filteredTemplates: model
    });
  }
}
