import { inject as service } from '@ember/service';
import RSVP from 'rsvp';
import Route from '@ember/routing/route';

export default Route.extend({
  router: service(),
  template: service(),
  resultCache: Object(),
  model(params) {
    this._super(...arguments);

    if (this.resultCache.templateData) {
      return this.resultCache;
    }

    return RSVP.all([
      this.template.getOneTemplateWithMetrics(
        `${params.namespace}/${params.name}`
      ),
      this.template.getTemplateTags(params.namespace, params.name)
    ]).then(arr => {
      let [verPayload, tagPayload] = arr;

      verPayload = verPayload.filter(t => t.namespace === params.namespace);

      tagPayload.forEach(tagObj => {
        const taggedVerObj = verPayload.find(
          verObj => verObj.version === tagObj.version
        );

        if (taggedVerObj) {
          taggedVerObj.tag = taggedVerObj.tag
            ? `${taggedVerObj.tag} ${tagObj.tag}`
            : tagObj.tag;
        }
      });

      const result = {};

      result.namespace = params.namespace;
      result.name = params.name;
      result.templateData = verPayload;
      result.templateTagData = tagPayload;

      this.resultCache = result;

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
        this.router.transitionTo('/404');
      }

      return true;
    }
  }
});
