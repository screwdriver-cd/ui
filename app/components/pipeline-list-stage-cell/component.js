import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  stageName: computed('record.stage.stageName', {
    get() {
      return this.record.stage?.stageName || 'N/A';
    }
  })
});
