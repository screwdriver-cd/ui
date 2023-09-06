import Route from '@ember/routing/route';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';

export default Route.extend(AuthenticatedRouteMixin, {
  routeAfterAuthentication: 'commands',
  model() {
    return this;
  },
  actions: {
    willTransition(transition) {
      const newParams = transition.to.params;
      const { routeParams } = this.controller;
      const newRouteParams = { ...routeParams, ...newParams };

      this.controller.set('routeParams', newRouteParams);
    }
  }
});
