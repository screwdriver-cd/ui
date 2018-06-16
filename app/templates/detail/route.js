import { inject as service } from '@ember/service';
import RSVP from 'rsvp';
import Route from '@ember/routing/route';
import templateHelper from 'screwdriver-ui/utils/template';
const { getFullName, getLastUpdatedTime } = templateHelper;

export default Route.extend({
  template: service(),
  model(params) {
    return RSVP.all([
      this.get('template').getOneTemplate(params.name),
      this.get('template').getTemplateTags(params.name)
    ]).then((arr) => {
      const [verPayload, tagPayload] = arr;

      tagPayload.forEach((tagObj) => {
        const taggedVerObj = verPayload.find(verObj => verObj.version === tagObj.version);

        taggedVerObj.tag = taggedVerObj.tag ? `${taggedVerObj.tag} ${tagObj.tag}` : tagObj.tag;
      });

      verPayload.forEach((verObj) => {
        // Construct full template name
        verObj.fullName = getFullName({
          name: verObj.name,
          namespace: verObj.namespace
        });

        if (verObj.createTime) {
          // Add last updated time
          verObj.lastUpdated = getLastUpdatedTime({ createTime: verObj.createTime });
        }
      });

      return verPayload;
    });
  },
  setupController(controller, model) {
    this._super(controller, model);
    controller.reset();
  }
});
