import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { get } from '@ember/object';

export default Route.extend({
  session: service(),
  router: service(),
  store: service(),
  routeAfterAuthentication: 'pipeline.child-pipelines',
  titleToken: 'Child Pipelines',
  model() {
    // Guests should not access this page
    if (get(this, 'session.data.authenticated.isGuest')) {
      this.router.transitionTo('pipeline');
    }

    const { pipeline } = this.modelFor('pipeline');

    return this.store
      .query('pipeline', {
        configPipelineId: pipeline.id
      })
      .then(pipelines => ({
        pipelines,
        pipeline
      }));
  },
  actions: {
    refreshModel: function refreshModel() {
      this.refresh();
    }
  }
});
