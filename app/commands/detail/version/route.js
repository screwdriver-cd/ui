import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';
import { compareVersions } from 'screwdriver-ui/helpers/compare-versions';
import { NotFoundError } from '../../../utils/not-found-error';

export default Route.extend({
  router: service(),
  command: service(),
  model(params) {
    const verPayload = this.modelFor('commands.detail').commandData;
    const tagPayload = this.modelFor('commands.detail').commandTagData;

    let version;

    const versionExists = verPayload.filter(t =>
      t.version.concat('.').startsWith(params.version.concat('.'))
    );
    const tagExists = tagPayload.filter(c => c.tag === params.version);

    if (tagExists.length === 0 && versionExists.length === 0) {
      throw new NotFoundError('Command not found');
    }

    if (versionExists.length > 0) {
      // Sort commands by descending order
      versionExists.sort((a, b) => compareVersions(b.version, a.version));
      ({ version } = versionExists[0]);
    }

    this.controllerFor('commands.detail').set(
      'versionOrTagFromUrl',
      version || params.version
    );
  }
});
