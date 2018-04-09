import { inject as service } from '@ember/service';
import RSVP from 'rsvp';
import Route from '@ember/routing/route';

export default Route.extend({
  command: service(),
  model(params) {
    return RSVP.all([
      this.get('command').getOneCommand(params.namespace, params.name)
    ]).then((arr) => {
      const [verPayload] = arr;

      return verPayload;
    });
  },
  setupController: function (controller, model) {
    this._super(controller, model);
    controller.reset();
  }
});
