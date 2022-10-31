// import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import Controller from '@ember/controller';
import { alias } from '@ember/object/computed';

export default Controller.extend({
  router: service(),
  showCreatePipeline: false,
  collections: [],
  session: service(),
  scmContexts: alias('model'),
  actions: {
    invalidateSession() {
      this.session.set('data.sessionChanged', false);

      return this.session.invalidate();
    },
    search(params) {
      this.router.transitionTo('search', { queryParams: { query: params } });
    },
    authenticate(scmContext) {
      const { session } = this;
      const currentContext = session.get('data.authenticated.scmContext');

      session
        .authenticate('authenticator:screwdriver-api', scmContext)
        .then(() => {
          if (currentContext && currentContext !== scmContext) {
            session.set('data.sessionChanged', true);
          }
        });
    }
  }
});
