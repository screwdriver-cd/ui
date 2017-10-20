import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';
import UnauthenticatedRouteMixin from 'ember-simple-auth/mixins/unauthenticated-route-mixin';

export default Route.extend(UnauthenticatedRouteMixin, {
  scmService: service('scm'),
  titleToken: 'Login',
  routeIfAlreadyAuthenticated: 'home',
  model() {
    return this.get('scmService').getScms();
  }
});
