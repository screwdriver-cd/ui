import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import Controller from '@ember/controller';
const { alias } = computed;

export default Controller.extend({
  session: service('session'),
  scmContexts: alias('model'),
  actions: {
    invalidateSession() {
      this.get('session').set('data.sessionChanged', false);

      return this.get('session').invalidate();
    },
    search(params) {
      this.transitionToRoute('search', { queryParams: { query: params } });
    },
    authenticate(scmContext) {
      const session = this.get('session');
      const currentContext = session.get('data.authenticated.scmContext');

      session.authenticate('authenticator:screwdriver-api', scmContext).then(() => {
        if (currentContext && currentContext !== scmContext) {
          session.set('data.sessionChanged', true);
        }
      });
    }
  }
});
