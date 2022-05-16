import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { later } from '@ember/runloop';
import { getWithDefault } from '@ember/object';

export default Route.extend({
  router: service(),

  beforeModel() {
    const { name } = this.router.currentRoute;

    if (name === 'pipeline.build.index') {
      const pipelineId = getWithDefault(
        this.router.currentRoute.parent.parent.params,
        'pipeline_id',
        ''
      );

      later(
        this,
        function redirection() {
          this.transitionTo('pipeline', pipelineId);
        },
        3000
      );
    }
  }
});
