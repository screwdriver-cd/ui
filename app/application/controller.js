import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import Controller from '@ember/controller';

export default Controller.extend({
  queryParams: ['fromUrl'],
  fromUrl: null,
  session: service('session'),
  currentUrl: computed('currentPath', () => window.location.pathname),
  actions: {
    invalidateSession() {
      this.get('session').invalidate();
    },
    search(params) {
      this.transitionToRoute('search', { queryParams: { query: params } });
    },
    authenticate(scmContext) {
      this.get('session').authenticate('authenticator:screwdriver-api', scmContext);
    }
  }
});
