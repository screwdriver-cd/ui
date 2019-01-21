import { computed } from '@ember/object';
import Component from '@ember/component';
import { statusIcon } from 'screwdriver-ui/utils/build';

export default Component.extend({
  classNameBindings: ['build.status'],
  build: computed('job.builds', {
    get() {
      return this.get('job.builds').objectAt(0);
    }
  }),
  displayName: computed('job.name', {
    get() {
      return `#${this.get('job.name').replace('PR-', '').split(':').join(' - ')}`;
    }
  }),
  icon: computed('build.status', {
    get() {
      return statusIcon(this.get('build.status'), true);
    }
  })
});
