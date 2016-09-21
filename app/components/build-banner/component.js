import Ember from 'ember';

export default Ember.Component.extend({
  classNames: ['build-banner'],
  classNameBindings: ['build.status'],

  truncatedSha: Ember.computed('build.sha', {
    get() {
      return this.get('build.sha').substr(0, 6);
    }
  }),

  buildAction: Ember.computed('build.status', {
    get() {
      const status = this.get('build.status');

      if (status === 'RUNNING' || status === 'QUEUED') {
        return 'Stop';
      }

      return 'Restart';
    }
  }),

  hasButton: Ember.computed('buildAction', 'job.name', {
    get() {
      if (this.get('buildAction') === 'Stop') {
        return true;
      }

      if (/^PR\-/.test(this.get('job.name'))) {
        return true;
      }

      return false;
    }
  }),

  actions: {
    toggleBuild() {
      if (this.get('buildAction') === 'Stop') {
        this.get('onStop')();
      } else {
        this.get('onStart')();
      }
    }
  }
});
