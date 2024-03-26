import Route from '@ember/routing/route';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';

export default class TemplatesPipelineDetailRoute extends Route.extend(
  AuthenticatedRouteMixin
) {
  @service template;

  @service router;

  @service store;

  async loadOnePipelineTemplateAllVersions(namespace, name) {
    const pipelineTemplateVersions =
      await this.template.getPipelineTemplateVersions(namespace, name);

    return pipelineTemplateVersions;
  }

  async loadOnePipelineTemplateAllTags(namespace, name) {
    const pipelineTemplateTags = await this.template.getPipelineTemplateTags(
      namespace,
      name
    );

    return pipelineTemplateTags;
  }

  async model(params) {
    const { namespace, name } = params;
    const fullName = `${namespace}/${name}`;

    let pipelineTemplateVersions;

    let pipelineTemplateTags;

    try {
      pipelineTemplateTags = await this.loadOnePipelineTemplateAllTags(
        namespace,
        name
      );

      pipelineTemplateVersions = await this.loadOnePipelineTemplateAllVersions(
        namespace,
        name
      );

      // TODO: polyfill pipeline template attributes
      pipelineTemplateVersions.forEach(v => {
        v.name = name;
        v.namespace = namespace;
        v.fullName = fullName;
      });
    } catch (err) {
      this.router.transitionTo('/404');
    }

    return {
      name,
      namespace,
      pipelineTemplateVersions,
      pipelineTemplateTags
    };
  }

  @action
  resetFilter() {
    this.refresh();
  }
}
