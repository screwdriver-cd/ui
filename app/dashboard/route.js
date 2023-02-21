import Route from '@ember/routing/route';
import { get } from '@ember/object';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';
import { inject as service } from '@ember/service';

export default Route.extend(AuthenticatedRouteMixin, {
  router: service(),
  titleToken: 'Dashboard',
  routeAfterAuthentication: 'home',

  beforeModel(/* transition */) {
    if (
      !get(this, 'session.isAuthenticated') ||
      get(this, 'session.data.authenticated.isGuest')
    ) {
      this.router.replaceWith('home');
    }
  },

  model() {
    return this.controllerFor('application').get('collections') === undefined
      ? []
      : this.controllerFor('application').get('collections');
  },

  actions: {
    error(/* error, transition */) {
      this.router.replaceWith('home');
    }
  }
});
