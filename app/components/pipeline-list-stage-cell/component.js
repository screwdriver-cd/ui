import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  stageName: computed('record.job.stageName', {
    get() {
      return this.record.job?.stageName || 'N/A';
    }
  })
});
