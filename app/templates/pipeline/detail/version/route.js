import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';
import { compareVersions } from 'screwdriver-ui/helpers/compare-versions';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';
import { NotFoundError } from '../../../../utils/not-found-error';

export default class TemplatesPipelineDetailVersionRoute extends Route.extend(
  AuthenticatedRouteMixin
) {
  @service router;

  @service template;

  determineVersion(pVersion, verPayload, tagPayload) {
    let version;

    const versionExists = verPayload.filter(t =>
      t.version.concat('.').startsWith(pVersion.concat('.'))
    );
    const tagExists = tagPayload.filter(t => t.tag === pVersion);

    if (tagExists.length === 0 && versionExists.length === 0) {
      throw new NotFoundError('Pipeline template not found');
    }

    if (versionExists.length > 0) {
      // Sort commands by descending order
      versionExists.sort((a, b) => compareVersions(b.version, a.version));
      ({ version } = versionExists[0]);
    }

    return version || pVersion;
  }

  async model(params) {
    const verPayload = this.modelFor(
      'templates.pipeline.detail'
    ).pipelineTemplateVersions;
    const tagPayload = this.modelFor(
      'templates.pipeline.detail'
    ).pipelineTemplateTags;

    this.controllerFor('templates.pipeline.detail').set(
      'versionOrTagFromUrl',
      this.determineVersion(params.version, verPayload, tagPayload)
    );
  }
}
