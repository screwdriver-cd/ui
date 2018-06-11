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
      console.log('------------PARAMS-----------')
      console.log(params)
      const [verPayload, tagPayload] = arr;

      tagPayload.forEach((tagObj) => {
        const taggedVerObj = verPayload.find(verObj => verObj.version === tagObj.version);

        taggedVerObj.tag = taggedVerObj.tag ? `${taggedVerObj.tag} ${tagObj.tag}` : tagObj.tag;
      });

      return verPayload;
    });
  },
  setupController(controller, model) {
    this._super(controller, model);
    controller.reset();
  },
  actions: {
    willTransition(transition) {
      console.log('in will transition at detail');
      return true;
      // this.modelFor('templates').reload();
    }
  }
});
