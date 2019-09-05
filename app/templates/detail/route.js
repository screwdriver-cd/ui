import { inject as service } from '@ember/service';
import RSVP from 'rsvp';
import Route from '@ember/routing/route';

export default Route.extend({
  template: service(),
  model(params) {
    return RSVP.all([
      this.template.getOneTemplate(`${params.namespace}/${params.name}`),
      this.template.getTemplateTags(params.namespace, params.name)
    ]).then(arr => {
      let [verPayload, tagPayload] = arr;

      if (params.version) {
        const exsistVersion = verPayload.filter(t => t.version === params.version);
        const exsistTag = tagPayload.filter(t => t.tag === params.version);

        if (exsistTag.length === 0 && exsistVersion.length === 0) {
          this.transitionTo('/404');
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
      result.versionOrTagFromUrl = params.version;
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
