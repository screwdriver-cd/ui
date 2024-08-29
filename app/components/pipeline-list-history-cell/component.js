import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  builds: computed('record.history', {
    get() {
      return this.record.history;
    }
  }),
  pipeline: computed('record.pipelineId', {
    get() {
      return {
        id: this.record.pipelineId
      };
    }
  })
});
