import { inject as service } from '@ember/service';
import Component from '@ember/component';

export default Component.extend({
  // start all child pipelines
  start: service('pipeline-startall'),
  errorMessage: '',
  isShowingModal: false,
  actions: {
    startAll() {
      this.set('isShowingModal', true);

      return this.start
        .startAll(this.pipeline.id)
        .catch(error => this.set('errorMessage', error))
        .finally(() => this.set('isShowingModal', false));
    },
    deletePipeline(pipeline) {
      return pipeline.destroyRecord().then(() => {
        this.onDeleteChildPipeline();
      });
    }
  }
});
