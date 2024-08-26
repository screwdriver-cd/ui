import Component from '@ember/component';
import { computed } from '@ember/object';
import { unfinishedStatuses } from 'screwdriver-ui/utils/build';

export default Component.extend({
  stopButtonClass: computed('record.actions.latestBuild.status', {
    get() {
      // console.log('record.actions: ', record.actions);
      const status = this.get('record.actions.latestBuild.status');

      console.log('record.actions.latestBuild.status: ', status);

      if (unfinishedStatuses.includes(status)) {
        return 'clicks-enabled-stop';
      }

      return 'clicks-disabled';
    }
  }),
  startButtonClass: computed('record.actions.manualStartEnabled', {
    get() {
      const manualStartEnabled = this.get('record.actions.manualStartEnabled');

      if (manualStartEnabled) {
        return 'clicks-enabled-start';
      }

      return 'clicks-disabled';
    }
  }),
  actions: {
    startSingleBuild(buildState = undefined) {
      const { actions } = this.record;

      if (['START', 'RESTART'].includes(buildState) && actions.hasParameters) {
        actions.openParametersModal(actions.jobId, buildState);
      } else {
        actions.startSingleBuild(actions.jobId, actions.jobName, buildState);
      }
    },
    stopBuild() {
      const { actions } = this.record;

      actions.stopBuild(null, { buildId: actions.latestBuild.id });
    }
  }
});
