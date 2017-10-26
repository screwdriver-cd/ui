import { inject as service } from '@ember/service';
import { alias } from '@ember/object/computed';
import Controller from '@ember/controller';

export default Controller.extend({
  session: service('session'),
  scmContexts: alias('model'),
  actions: {
    authenticate(scmContext) {
      this.get('session').authenticate('authenticator:screwdriver-api', scmContext);
    }
  }
});
