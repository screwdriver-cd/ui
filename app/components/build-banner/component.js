import Ember from 'ember';

export default Ember.Component.extend({
  classNames: ['build-banner'],
  classNameBindings: ['buildStatus'],

  buildAction: Ember.computed('buildStatus', {
    get() {
      const status = this.get('buildStatus');

      if (status === 'RUNNING' || status === 'QUEUED') {
        return 'Stop';
      }

      return 'Restart';
    }
  }),

  hasButton: Ember.computed('buildAction', 'jobName', {
    get() {
      if (this.get('buildAction') === 'Stop') {
        return true;
      }

      if (/^PR-/.test(this.get('jobName'))) {
        return true;
      }

      return false;
    }
  }),

  willRender() {
    this._super(...arguments);

    this.get('reloadBuild')();
  },

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
