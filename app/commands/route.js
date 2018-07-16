import Route from '@ember/routing/route';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';

export default Route.extend(AuthenticatedRouteMixin, {
  routeAfterAuthentication: 'commands',
  model() {
    return this;
  },
  actions: {
    willTransition(transition) {
      let newParams = transition.params[transition.targetName];

      this.controller.set('routeParams', newParams);
    }
  }
});
