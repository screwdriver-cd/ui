import Component from '@ember/component';
import { computed } from '@ember/object';

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
  })
});
