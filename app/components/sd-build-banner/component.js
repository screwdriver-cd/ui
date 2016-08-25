import Ember from 'ember';

export default Ember.Component.extend({
  icon: Ember.computed('build.status', {
    get() {
      const icons = {
        QUEUED: 'fa-clock-o',
        RUNNING: 'fa-spinner fa-spin',
        SUCCESS: 'fa-check'
      };

      return icons[this.get('build.status')] || 'fa-times';
    }
  })
});
