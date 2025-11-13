import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { get } from '@ember/object';

export default Route.extend({
  session: service(),
  router: service(),
  store: service(),
  optInRouteMapping: service(),
  routeAfterAuthentication: 'pipeline.child-pipelines',
  beforeModel() {
    if (
      this.optInRouteMapping.switchFromV2 ||
      localStorage.getItem('oldUi') === 'true'
    ) {
      this.optInRouteMapping.switchFromV2 = false;

      return;
    }

    const { pipeline } = this.modelFor('pipeline');

    this.router.transitionTo('v2.pipeline.child-pipelines', pipeline.id);
  },
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
