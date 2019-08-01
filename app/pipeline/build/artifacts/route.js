import Route from '@ember/routing/route';

export default Route.extend({
  routeAfterAuthentication: 'pipeline.build',

  actions: {
    didTransition() {
      this.controllerFor('pipeline.build').set('activeTab', 'artifacts');

      // NOT delegate to its parent route's didTranstion
      return false;
    }
  }
});
