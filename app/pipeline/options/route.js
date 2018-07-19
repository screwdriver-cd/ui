import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { get } from '@ember/object';

export default Route.extend({
  session: service(),
  routeAfterAuthentication: 'pipeline.options',
  model() {
    // Guests should not access this page
    if (get(this, 'session.data.authenticated.isGuest')) {
      this.transitionTo('pipeline');
    }

    const pipeline = this.modelFor('pipeline').pipeline;

    // Prevent double render when jobs list updates asynchronously
    return pipeline.get('jobs').then(jobs => ({ pipeline, jobs }));
  },
  actions: {
    willTransition() {
      // Reset error message when switching pages
      this.controller.set('errorMessage', '');
    }
  }
});
