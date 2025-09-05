import Route from '@ember/routing/route';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import { compareVersions } from 'screwdriver-ui/helpers/compare-versions';
import { NotFoundError } from '../../../utils/not-found-error';

export default class TemplatesPipelineDetailRoute extends Route.extend(
  AuthenticatedRouteMixin
) {
  @service template;

  @service router;

  @service store;

  async loadOnePipelineTemplateMeta(namespace, name) {
    const pipelineTemplateMeta = await this.template.getPipelineTemplateMeta(
      namespace,
      name
    );

    return pipelineTemplateMeta;
  }

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

    let pipelineTemplateMeta;

    let pipelineTemplateVersions;

    let pipelineTemplateTags;

    try {
      pipelineTemplateMeta = await this.loadOnePipelineTemplateMeta(
        namespace,
        name
      );

      const { trustedSinceVersion, pipelineId } = pipelineTemplateMeta;

      pipelineTemplateTags = await this.loadOnePipelineTemplateAllTags(
        namespace,
        name
      );

      pipelineTemplateVersions = await this.loadOnePipelineTemplateAllVersions(
        namespace,
        name
      );

      pipelineTemplateVersions.forEach(v => {
        if (
          trustedSinceVersion &&
          compareVersions(v.version, trustedSinceVersion) >= 0
        ) {
          v.trusted = true;
        }

        v.pipelineId = pipelineId;
        v.name = name;
        v.namespace = namespace;
        v.fullName = fullName;
      });
    } catch (err) {
      throw new NotFoundError('Pipeline template not found');
    }

    return {
      name,
      namespace,
      pipelineTemplateVersions,
      pipelineTemplateTags,
      pipelineTemplateMeta
    };
  }

  @action
  reloadModel() {
    this.refresh();
  }
}
