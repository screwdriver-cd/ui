import classic from 'ember-classic-decorator';
import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';
import { get } from '@ember/object';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';

@classic
export default class UserSettingsRoute extends Route.extend(
  AuthenticatedRouteMixin
) {
  @service
  session;

  titleToken = 'User Settings';

  routeAfterAuthentication = 'user-settings';

  model() {
    // Guests should not access this page
    if (get(this, 'session.data.authenticated.isGuest')) {
      this.transitionTo('home');
    }
    this.store.unloadAll('token');

    return this.store.findAll('token');
  }
}
