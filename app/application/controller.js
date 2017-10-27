import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import Controller from '@ember/controller';
const { alias } = computed;

export default Controller.extend({
  session: service('session'),
  queryParams: ['fromUrl'],
  fromUrl: null,
  currentUrl: computed('currentPath', () => window.location.pathname),
  scmContexts: alias('model'),
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
