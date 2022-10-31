import Component from '@ember/component';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';

export default Component.extend({
  shuttle: service(),
  jobId: computed('record.job', {
    get() {
      const { job } = this.record;

      return job && job.build && job.build.jobId ? job.build.jobId : '';
    }
  })
});
