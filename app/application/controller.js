import Ember from 'ember';

export default Ember.Controller.extend({
  queryParams: ['fromUrl'],
  fromUrl: null,
  session: Ember.inject.service('session'),
  currentUrl: Ember.computed('currentPath', () => window.location.pathname),
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
