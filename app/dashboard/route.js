import classic from 'ember-classic-decorator';
import Route from '@ember/routing/route';
import { get, action } from '@ember/object';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';

@classic
export default class DashboardRoute extends Route.extend(
  AuthenticatedRouteMixin
) {
  titleToken = 'Dashboard';

  routeAfterAuthentication = 'home';

  beforeModel /* transition */() {
    if (
      !get(this, 'session.isAuthenticated') ||
      get(this, 'session.data.authenticated.isGuest')
    ) {
      this.replaceWith('home');
    }
  }

  model() {
    return this.modelFor('application').collections;
  }

  @action
  error /* error, transition */() {
    this.replaceWith('home');
  }
}
