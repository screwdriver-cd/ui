import Route from '@ember/routing/route';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';
import { inject as service } from '@ember/service';

export default class TemplatesPipelineIndexRoute extends Route.extend(
  AuthenticatedRouteMixin
) {
  @service template;

  async loadAllPipelineTemplates() {
    const pipelineTemplates = await this.template.getAllPipelineTemplates();

    return pipelineTemplates;
  }

  async model() {
    const pipelineTemplates = await this.loadAllPipelineTemplates();

    return pipelineTemplates;
  }
}
