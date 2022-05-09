import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { later } from '@ember/runloop';

export default Route.extend({
  router: service(),

  beforeModel() {
    const { name } = this.router.currentRoute;
    const { pipelineId } = this.router.currentRoute.parent.parent.params;

    if (name === 'pipeline.build.index') {
      later(
        this,
        function () {
          this.transitionTo('pipeline', pipelineId);
        },
        3000
      );
    }
  }
});
