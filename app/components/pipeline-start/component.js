import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  startArgs: computed('prNum', 'jobs', {
    get() {
      const prNum = this.get('prNum');
      const jobs = this.get('jobs') || [];

      if (!prNum) {
        return [];
      }

      // Pass arguments with PR number and jobs to reload when starting PR event.
      return [prNum, jobs];
    }
  }),
  actions: {
    startBuild() {
      const args = this.get('startArgs');
      const startFunc = this.get('startBuild');

      startFunc.apply(null, args);
    }
  }
});
