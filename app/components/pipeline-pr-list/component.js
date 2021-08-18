import Component from '@ember/component';
import { computed } from '@ember/object';
import { isActiveBuild } from 'screwdriver-ui/utils/build';

export default Component.extend({
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
  })
});
