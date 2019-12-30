import { inject as service } from '@ember/service';
import RSVP from 'rsvp';
import Route from '@ember/routing/route';
import { compareVersions } from 'screwdriver-ui/helpers/compare-versions';

export default Route.extend({
  template: service(),
  model(params) {
    return RSVP.all([
      this.template.getOneTemplate(`${params.namespace}/${params.name}`),
      this.template.getTemplateTags(params.namespace, params.name)
    ]).then(arr => {
      let [verPayload, tagPayload] = arr;
      let version;

      if (params.version) {
        const versionExists = verPayload.filter(t => t.version.startsWith(params.version));
        const tagExists = tagPayload.filter(t => t.tag === params.version);

        if (tagExists.length === 0 && versionExists.length === 0) {
          this.transitionTo('/404');
        }

        if (versionExists.length > 0) {
          // Sort commands by descending order
          versionExists.sort((a, b) => compareVersions(b.version, a.version));
          ({ version } = versionExists[0]);
        }
      }

      verPayload = verPayload.filter(t => t.namespace === params.namespace);

      tagPayload.forEach(tagObj => {
        const taggedVerObj = verPayload.find(verObj => verObj.version === tagObj.version);

        if (taggedVerObj) {
          taggedVerObj.tag = taggedVerObj.tag ? `${taggedVerObj.tag} ${tagObj.tag}` : tagObj.tag;
        }
      });

      let result = {};

      result.templateData = verPayload;
      result.versionOrTagFromUrl = version || params.version;
      result.templateTagData = tagPayload;

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
  }
});
