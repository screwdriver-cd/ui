import Ember from 'ember';

export default Ember.Component.extend({
  classNameBindings: ['build.status'],
  build: Ember.computed('job.builds', {
    get() {
      return this.get('job.builds').objectAt(0);
    }
  }),
  icon: Ember.computed('build.status', {
    get() {
      const status = this.get('build.status');
      let icon;

      switch (status) {
      case 'QUEUED':
      case 'RUNNING':
        icon = 'fa-spinner fa-spin';
        break;
      case 'SUCCESS':
        icon = 'fa-check';
        break;
      default:
        icon = 'fa-times';
        break;
      }

      return icon;
    }
  })
});
