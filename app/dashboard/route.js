import Route from '@ember/routing/route';
import { get } from '@ember/object';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';
import { inject as service } from '@ember/service';

export default Route.extend(AuthenticatedRouteMixin, {
  router: service(),
  store: service(),
  routeAfterAuthentication: 'home',

  beforeModel(/* transition */) {
    if (
      !get(this, 'session.isAuthenticated') ||
      get(this, 'session.data.authenticated.isGuest')
    ) {
      this.router.replaceWith('home');
    }
  },

  async model() {
    let collections = this.store.peekAll('collection');

    if (!collections.length) {
      collections = await this.store.findAll('collection');
    }

    return collections;
  },

  actions: {
    error(/* error, transition */) {
      this.router.replaceWith('home');
    }
  }
});
