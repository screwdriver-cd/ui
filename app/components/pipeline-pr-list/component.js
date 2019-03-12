import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  didInsertElement() {
    this._super(...arguments);
    this.set('inited', false);
  },
  inited: true,
  showJobs: computed('pullRequestGroups.[]', {
    get() {
      return this.get('pullRequestGroups').map(
        group => this.get('inited') || group.some(g => !!g.get('builds.length'))
      );
    }
  })
});
