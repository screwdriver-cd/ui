import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { get } from '@ember/object';

export default Route.extend({
  session: service(),
  router: service(),
  optInRouteMapping: service(),
  routeAfterAuthentication: 'pipeline.options',
  beforeModel() {
    if (localStorage.getItem('oldUi') === 'true') {
      return;
    }

    const { pipeline_id: pipelineId } = this.paramsFor('pipeline');

    this.transitionTo('v2.pipeline.settings.index', pipelineId);
  },
  model() {
    // Guests should not access this page
    if (get(this, 'session.data.authenticated.isGuest')) {
      this.router.transitionTo('pipeline');
    }

    const { pipeline } = this.modelFor('pipeline');

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
