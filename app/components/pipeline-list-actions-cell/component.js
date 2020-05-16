import Component from '@ember/component';
import { computed } from '@ember/object';
import { unfinishedStatuses } from 'screwdriver-ui/utils/build';

export default Component.extend({
  stopButtonClass: computed('value.latestBuild', {
    get() {
      const status = this.get('value.latestBuild.status');

      if (unfinishedStatuses.includes(status)) {
        return 'clicks-enabled';
      }

      return 'clicks-disabled';
    }
  }),
  actions: {
    startSingleBuild(status = undefined) {
      const value = this.get('value');

      value.startSingleBuild(value.jobId, value.jobName, status);
    },
    stopBuild() {
      const value = this.get('value');

      value.stopBuild(null, { buildId: value.latestBuild.id });
    }
  }
});
