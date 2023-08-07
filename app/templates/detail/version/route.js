import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';
import { compareVersions } from 'screwdriver-ui/helpers/compare-versions';

export default Route.extend({
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
      this.router.transitionTo('/404');
    }

    if (versionExists.length > 0) {
      // Sort commands by descending order
      versionExists.sort((a, b) => compareVersions(b.version, a.version));
      ({ version } = versionExists[0]);
    }

    return version || pVersion;
  },
  async model(params) {
    const verPayload = this.modelFor('templates.detail').templateData;
    const tagPayload = this.modelFor('templates.detail').templateTagData;

    this.controllerFor('templates.detail').set(
      'versionOrTagFromUrl',
      this.determineVersion(params.version, verPayload, tagPayload)
    );

    return params.version;
  }
});
