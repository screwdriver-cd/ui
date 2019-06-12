import { inject as service } from '@ember/service';
import { alias } from '@ember/object/computed';
import Controller from '@ember/controller';

export default Controller.extend({
  router: service(),
  session: service('session'),
  scmContexts: alias('model'),
  actions: {
    authenticate(scmContext) {
      this.session.authenticate('authenticator:screwdriver-api', scmContext);
    }
  }
});
