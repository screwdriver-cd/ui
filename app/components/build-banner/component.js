import Ember from 'ember';

export default Ember.Component.extend({
  classNames: ['build-banner'],
  classNameBindings: ['buildStatus'],
  isPR: Ember.computed.match('jobName', /^PR-/),
  jobNames: Ember.computed.mapBy('jobs', 'name'),

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

  previous: Ember.computed('eventBuilds', 'jobs', 'jobName', {
    get() {
      if (this.get('isPR')) {
        return null;
      }
      const prevIndex = this.get('jobNames').indexOf(this.get('jobName')) - 1;

      return prevIndex < 0 ? null : this.get('eventBuilds').objectAt(prevIndex);
    }
  }),

  next: Ember.computed('eventBuilds', 'jobs', 'jobName', {
    get() {
      if (this.get('isPR')) {
        return null;
      }
      const nextIndex = this.get('jobNames').indexOf(this.get('jobName')) + 1;

      return nextIndex >= this.get('jobs').length
      ? null : this.get('eventBuilds').objectAt(nextIndex);
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
