import { inject as service } from '@ember/service';
import Controller from '@ember/controller';

export default Controller.extend({
  session: service('session'),
  actions: {
    authenticate(scmContext) {
      this.get('session').authenticate('authenticator:screwdriver-api', scmContext);
    }
  }
});
