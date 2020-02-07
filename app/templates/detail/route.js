import { inject as service } from '@ember/service';
import RSVP from 'rsvp';
import Route from '@ember/routing/route';
import { compareVersions } from 'screwdriver-ui/helpers/compare-versions';
import { set } from '@ember/object';

export default Route.extend({
  template: service(),
  resultCache: Object(),
  determineVersion(pVersion, verPayload, tagPayload) {
    let version;

    if (pVersion) {
      const versionExists = verPayload.filter(t => t.version.startsWith(pVersion));
      const tagExists = tagPayload.filter(t => t.tag === pVersion);

      if (tagExists.length === 0 && versionExists.length === 0) {
        this.transitionTo('/404');
      }

      if (versionExists.length > 0) {
        // Sort commands by descending order
        versionExists.sort((a, b) => compareVersions(b.version, a.version));
        ({ version } = versionExists[0]);
      }
    }

    return version || pVersion;
  },
  model(params) {
    this._super(...arguments);

    if (this.resultCache.templateData) {
      const versionOrTagFromUrl = this.determineVersion(
        params.version,
        this.resultCache.templateData,
        this.resultCache.templateTagData
      );

      set(this.resultCache, 'versionOrTagFromUrl', versionOrTagFromUrl);

      return this.resultCache;
    }

    return RSVP.all([
      this.template.getOneTemplateWithMetrics(`${params.namespace}/${params.name}`),
      this.template.getTemplateTags(params.namespace, params.name)
    ]).then(arr => {
      let [verPayload, tagPayload] = arr;
      let version = this.determineVersion(params.version, verPayload, tagPayload);

      verPayload = verPayload.filter(t => t.namespace === params.namespace);

      tagPayload.forEach(tagObj => {
        const taggedVerObj = verPayload.find(verObj => verObj.version === tagObj.version);

        if (taggedVerObj) {
          taggedVerObj.tag = taggedVerObj.tag ? `${taggedVerObj.tag} ${tagObj.tag}` : tagObj.tag;
        }
      });

      let result = {};

      result.templateData = verPayload;
      result.versionOrTagFromUrl = version;
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
        this.transitionTo('/404');
      }

      return true;
    }
  }
});
