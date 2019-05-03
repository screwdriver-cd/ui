import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  startArgs: computed('prNum', 'jobs', {
    get() {
      const jobs = this.jobs || [];
      const { prNum } = this;

      if (!prNum) {
        return [];
      }

      // Pass arguments with PR number and jobs to reload when starting PR event.
      return [prNum, jobs];
    }
  }),
  actions: {
    startBuild() {
      const args = this.startArgs;
      const startFunc = this.startBuild;

      startFunc.apply(null, args);
    }
  }
});
