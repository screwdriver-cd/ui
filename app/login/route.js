import classic from 'ember-classic-decorator';
import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';
import UnauthenticatedRouteMixin from 'ember-simple-auth/mixins/unauthenticated-route-mixin';

@classic
export default class LoginRoute extends Route.extend(
  UnauthenticatedRouteMixin
) {
  @service('scm')
  scmService;

  titleToken = 'Login';

  routeIfAlreadyAuthenticated = 'home';

  model() {
    return this.modelFor('application');
  }
}
