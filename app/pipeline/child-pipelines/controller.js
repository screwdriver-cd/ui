import Controller from '@ember/controller';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import { inject as service } from '@ember/service';

export default Controller.extend({
  session: service(),
  scmService: service('scm'),
  pipelines: computed('model.pipelines', {
    get() {
      let pipelines = this.get('model.pipelines');

      // add scm contexts into pipelines.
      return pipelines.map(pipeline => {
        const scm = this.scmService.getScm(pipeline.get('scmContext'));

        pipeline.set('scm', scm.displayName);
        pipeline.set('scmIcon', scm.iconType);

        return pipeline;
      });
    }
  }),
  pipeline: reads('model.pipeline')
});
