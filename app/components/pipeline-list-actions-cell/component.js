import Component from '@ember/component';
import { computed } from '@ember/object';
import { unfinishedStatuses } from 'screwdriver-ui/utils/build';

export default Component.extend({
  stopButtonClass: computed('value.latestBuild', {
    get() {
      const status = this.get('value.latestBuild.status');

      if (unfinishedStatuses.includes(status)) {
        return 'clicks-enabled-stop';
      }

      return 'clicks-disabled';
    }
  }),
  startButtonClass: computed('value.manualStartEnabled', {
    get() {
      const manualStartEnabled = this.get('value.manualStartEnabled');

      if (manualStartEnabled) {
        return 'clicks-enabled-start';
      }

      return 'clicks-disabled';
    }
  }),
  actions: {
    startSingleBuild(buildState = undefined) {
      const value = this.get('value');

      if (buildState === 'START' && value.hasParameters) {
        value.openParametersModal(value.jobId, buildState);
      } else {
        value.startSingleBuild(value.jobId, value.jobName, buildState);
      }
    },
    stopBuild() {
      const value = this.get('value');

      value.stopBuild(null, { buildId: value.latestBuild.id });
    }
  }
});
