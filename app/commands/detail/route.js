import { inject as service } from '@ember/service';
import RSVP from 'rsvp';
import Route from '@ember/routing/route';
import { get } from '@ember/object';
import { compareVersions } from 'screwdriver-ui/helpers/compare-versions';

export default Route.extend({
  command: service(),
  model(params) {
    return RSVP.all([
      this.command.getOneCommand(params.namespace, params.name),
      this.command.getCommandTags(params.namespace, params.name)
    ]).then(arr => {
      const [verPayload, tagPayload] = arr;
      let version;

      if (params.version) {
        const versionExists = verPayload.filter(t =>
          t.version.concat('.').startsWith(params.version.concat('.'))
        );
        const tagExists = tagPayload.filter(c => c.tag === params.version);

        if (tagExists.length === 0 && versionExists.length === 0) {
          this.transitionTo('/404');
        }

        if (versionExists.length > 0) {
          // Sort commands by descending order
          versionExists.sort((a, b) => compareVersions(b.version, a.version));
          ({ version } = versionExists[0]);
        }
      }

      tagPayload.forEach(tagObj => {
        const taggedVerObj = verPayload.find(verObj => verObj.version === tagObj.version);

        if (taggedVerObj) {
          taggedVerObj.tag = taggedVerObj.tag ? `${taggedVerObj.tag} ${tagObj.tag}` : tagObj.tag;
        }
      });

      let result = {};

      result.namespace = params.namespace;
      result.name = params.name;
      result.commandData = verPayload;
      result.versionOrTagFromUrl = version || params.version;
      result.commandTagData = tagPayload;

      return result;
    });
  },
  setupController(controller, model) {
    this._super(controller, model);
    controller.reset();
  },
  actions: {
    error(error) {
      if (error.status === 404) {
        this.transitionTo('/404');
      }

      return true;
    }
  },
  titleToken(model) {
    let title = `${get(model, 'namespace') || ''}/${get(model, 'name') || ''}`;
    const version = get(model, 'versionOrTagFromUrl');

    if (version !== undefined) {
      title = `${title}@${version}`;
    }

    return title;
  }
});
