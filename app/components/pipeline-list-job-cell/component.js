import Component from '@ember/component';
import { computed } from '@ember/object';
import { statusIcon } from 'screwdriver-ui/utils/build';

export default Component.extend({
  build: computed('record.job', {
    get() {
      const { build, isVirtualJob } = this.record.job;

      if (!build) {
        return null;
      }

      return {
        id: build.id,
        icon: statusIcon(build.status, false, isVirtualJob),
        status: build.status
      };
    }
  }),
  jobName: computed('record.job.jobName', 'record.job.displayName', {
    get() {
      if (this.record.job.displayName) {
        return this.record.job.displayName;
      }

      return this.record.job.jobName;
    }
  })
});
