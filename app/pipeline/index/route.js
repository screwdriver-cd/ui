import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default Route.extend({
  router: service(),
  routeAfterAuthentication: 'pipeline',
  beforeModel() {
    const { pipeline } = this.modelFor('pipeline');

    if (pipeline.get('childPipelines')) {
      this.router.transitionTo('pipeline.child-pipelines');
    } else {
      this.router.transitionTo('pipeline.events');
    }
  }
});
