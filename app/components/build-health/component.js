import Ember from 'ember';

export default Ember.Component.extend({
  tagName: 'span',
  className: ['build-health'],
  icon: Ember.computed('build', 'build.status', {
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
