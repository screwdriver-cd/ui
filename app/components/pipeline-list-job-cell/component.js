import Component from '@ember/component';
import { computed } from '@ember/object';
import { statusIcon } from 'screwdriver-ui/utils/build';

export default Component.extend({
  build: computed('record.job', {
    get() {
      console.log('this.record', this.record);
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
  pipeline: computed('record.pipelineId', {
    get() {
      return {
        id: this.record.pipelineId
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
