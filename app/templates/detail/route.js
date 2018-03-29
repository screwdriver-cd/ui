import { inject as service } from '@ember/service';
import RSVP from 'rsvp';
import Route from '@ember/routing/route';

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

      return verPayload;
    });
  },
  setupController: function (controller, model) {
    this._super(controller, model);
    controller.reset();
  }
});
