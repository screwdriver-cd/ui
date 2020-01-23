import Route from '@ember/routing/route';

export default Route.extend({
  model() {
    // return parent route model
    return this.modelFor('pipeline.build');
  },
  actions: {
    didTransition() {
      // delegate to its parent route's didTranstion
      return true;
    }
  }
});
