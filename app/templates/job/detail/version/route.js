import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';
import { compareVersions } from 'screwdriver-ui/helpers/compare-versions';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';
import { NotFoundError } from '../../../../utils/not-found-error';

export default Route.extend(AuthenticatedRouteMixin, {
  store: service(),
  router: service(),
  template: service(),
  determineVersion(pVersion, verPayload, tagPayload) {
    let version;

    const versionExists = verPayload.filter(t =>
      t.version.concat('.').startsWith(pVersion.concat('.'))
    );
    const tagExists = tagPayload.filter(t => t.tag === pVersion);

    if (tagExists.length === 0 && versionExists.length === 0) {
      throw new NotFoundError('Template not found');
    }

    if (versionExists.length > 0) {
      // Sort commands by descending order
      versionExists.sort((a, b) => compareVersions(b.version, a.version));
      ({ version } = versionExists[0]);
    }

    return version || pVersion;
  },
  async model(params) {
    const verPayload = this.modelFor('templates.job.detail').templateData;
    const tagPayload = this.modelFor('templates.job.detail').templateTagData;

    this.controllerFor('templates.job.detail').set(
      'versionOrTagFromUrl',
      this.determineVersion(params.version, verPayload, tagPayload)
    );
  }
});
