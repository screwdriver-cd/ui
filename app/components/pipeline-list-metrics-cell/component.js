import Component from '@ember/component';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';

export default Component.extend({
  shuttle: service(),
  jobId: computed('value', {
    get() {
      const { value } = this;

      return value && value.build && value.build.jobId ? value.build.jobId : '';
    }
  })
});
