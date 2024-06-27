// import Route from '@ember/routing/route';

// export default class NewPipelineOptionsRoute extends Route {}

import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { get } from '@ember/object';

export default Route.extend({
  session: service(),
  router: service(),
  routeAfterAuthentication: 'pipeline.options',
  model() {
    // Guests should not access this page
    if (get(this, 'session.data.authenticated.isGuest')) {
      this.router.transitionTo('pipeline');
    }

    const { pipeline } = this.modelFor('v2.pipeline');

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
