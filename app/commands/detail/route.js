import { inject as service } from '@ember/service';
import RSVP from 'rsvp';
import Route from '@ember/routing/route';
import templateHelper from 'screwdriver-ui/utils/template';
const { getLastUpdatedTime } = templateHelper;

export default Route.extend({
  command: service(),
  model(params) {
    return RSVP.all([
      this.get('command').getOneCommand(params.namespace, params.name)
    ]).then((arr) => {
      const [verPayload] = arr;

      verPayload.forEach((verObj) => {
        // Add last updated time
        if (verObj.createTime) {
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
