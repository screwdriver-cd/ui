import Route from '@ember/routing/route';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';

export default Route.extend(AuthenticatedRouteMixin, {
  routeAfterAuthentication: 'templates',
  model() {
    return this;
  },
  redirect(model, transition) {
    this.transitionTo('templates.pipeline');
  },
  actions: {
    willTransition(transition) {
      const newParams = transition.to.params;

      this.controller.set('routeParams', newParams);
    }
  }
});
