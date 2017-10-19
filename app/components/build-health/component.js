import { computed } from '@ember/object';
import Component from '@ember/component';

export default Component.extend({
  tagName: 'span',
  classNames: ['build-health'],
  icon: computed('build', 'build.status', {
    get() {
      const build = this.get('build');

      if (!build) {
        return '';
      }

      switch (build.status) {
      case 'SUCCESS':
        return 'check';
      case 'FAILURE':
        return 'times';
      case 'ABORTED':
        return 'stop';
      case 'RUNNING':
        return 'fa-spinner fa-spin';
      case 'QUEUED':
        return 'clock-o';
      default:
        return 'question';
      }
    }
  })
});
