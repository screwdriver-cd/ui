import { computed } from '@ember/object';
import Component from '@ember/component';

export default Component.extend({
  classNameBindings: ['build.status'],
  build: computed('job.builds', {
    get() {
      return this.get('job.builds').objectAt(0);
    }
  }),
  icon: computed('build.status', {
    get() {
      const status = this.get('build.status');
      let icon;

      switch (status) {
      case 'QUEUED':
      case 'RUNNING':
        icon = 'spinner fa-spin';
        break;
      case 'SUCCESS':
        icon = 'check';
        break;
      case 'CREATED':
        icon = 'fa-ban';
        break;
      default:
        icon = 'times';
        break;
      }

      return icon;
    }
  })
});
