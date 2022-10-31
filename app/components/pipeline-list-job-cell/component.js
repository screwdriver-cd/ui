import Component from '@ember/component';
import { computed } from '@ember/object';
import { statusIcon } from 'screwdriver-ui/utils/build';

export default Component.extend({
  build: computed('record.job', {
    get() {
      const { build } = this.record.job;

      if (!build) {
        return null;
      }

      return {
        id: build.id,
        icon: statusIcon(build.status),
        status: build.status
      };
    }
  }),
  jobName: computed('record.job.jobName', {
    get() {
      return this.record.job.jobName;
    }
  })
});