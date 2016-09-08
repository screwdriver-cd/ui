import Ember from 'ember';

export default Ember.Component.extend({
  classNames: ['build-banner'],
  /**
   * Maps build status with different icon.
   * @property {String} icon
   */
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
