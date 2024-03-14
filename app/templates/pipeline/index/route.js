import Route from '@ember/routing/route';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';
import { inject as service } from '@ember/service';

export default class TemplatesPipelineIndexRoute extends Route.extend(
  AuthenticatedRouteMixin
) {
  @service template;

  constructor() {
    super(...arguments);
  }

  async loadAllPipelineTemplates() {
    const pipelineTemplates = await this.template.fetchAllPipelineTemplates();

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
