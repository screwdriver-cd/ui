import Route from '@ember/routing/route';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';
import { inject as service } from '@ember/service';
import { get, setProperties } from '@ember/object';

export default class TemplatesPipelineDetailIndexRoute extends Route.extend(
  AuthenticatedRouteMixin
) {
  constructor() {
    super(...arguments);
    console.log('TemplatesPipelineDetailIndexRoute');
  }

  @service template;
  @service router;
  @service store;

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
    let pipelineTemplateVersions;

    try {
      pipelineTemplateVersions = await this.loadOnePipelineTemplateVersions(
        namespace,
        name
      );
    } catch (err) {
      // console.log('err', err);
      // throw(err);

      this.router.transitionTo('/404');
    }

    const pipelineTemplateLatestVersion =
      pipelineTemplateVersions.get('firstObject');

    return {
      name,
      namespace,
      pipelineTemplateLatestVersion,
      pipelineTemplateVersions
    };
  }
}
