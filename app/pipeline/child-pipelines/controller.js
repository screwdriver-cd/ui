import Controller from '@ember/controller';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import { hasInactivePipelines } from 'screwdriver-ui/utils/pipeline';

export default Controller.extend({
  session: service(),
  scmService: service('scm'),
  pipelines: computed('model.pipelines', {
    get() {
      const pipelines = this.get('model.pipelines');

      // add scm contexts into pipelines.
      return pipelines.map(pipeline => {
        const scm = this.scmService.getScm(pipeline.get('scmContext'));

        pipeline.set('scm', scm.displayName);
        pipeline.set('scmIcon', scm.iconType);

        return pipeline;
      });
    }
  }),
  hasInactivePipelines: computed('model.pipelines', {
    get() {
      return hasInactivePipelines(this.get('model.pipelines'));
    }
  }),
  pipeline: reads('model.pipeline'),

  actions: {
    onDeleteChildPipeline() {
      this.send('refreshModel');
    }
  }
});
