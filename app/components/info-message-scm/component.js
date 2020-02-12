import Component from '@ember/component';
import { inject as service } from '@ember/service';

export default Component.extend({
  type: 'info',
  session: service(),
  actions: {
    clearMessage: function clearMessage() {
      this.set('message', null);
    },
    authenticate(scmContext) {
      this.session.authenticate('authenticator:screwdriver-api', scmContext);
      this.set('message', null);
    }
  }
});
