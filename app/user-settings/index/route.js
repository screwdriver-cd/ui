import Route from '@ember/routing/route';

export default Route.extend({
  routeAfterAuthentication: 'user-settings',
  beforeModel() {
    this.transitionTo('user-settings.user-preferences');
  }
});
