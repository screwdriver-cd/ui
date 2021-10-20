import { inject as service } from '@ember/service';
import Component from '@ember/component';
import { computed, set } from '@ember/object';
import { isActiveBuild } from 'screwdriver-ui/utils/build';
export default Component.extend({
  store: service(),

  didInsertElement() {
    this._super(...arguments);
    this.set('inited', false);
  },
  inited: true,
  showJobs: computed('jobs.@each.builds', 'inited', {
    get() {
      return this.inited || this.jobs.some(j => !!j.get('builds.length'));
    }
  }),
  isRunning: computed('jobs.@each.builds', 'inited', {
    get() {
      return this.jobs.some(j => {
        const status = j.builds.get('firstObject.status');
        const endTime = j.builds.get('firstObject.endTime');

        return isActiveBuild(status, endTime);
      });
    }
  }),
  actions: {
    async selectPR() {
      const pipelineId = this.get('pipeline.id');
      const jobName = this.get('jobs.firstObject.name');
      // extract prNumber from jobName
      const prNum = jobName.split(/PR-(\d+):/)[1];
      const events = await this.store.query('event', {
        pipelineId,
        page: 1,
        count: 1,
        prNum
      });
      const selectedEventId = events.get('firstObject.id');

      set(this, 'selected', selectedEventId);
    }
  }
});
