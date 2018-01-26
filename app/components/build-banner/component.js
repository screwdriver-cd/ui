import { computed } from '@ember/object';
import { match, mapBy } from '@ember/object/computed';
import Component from '@ember/component';

export default Component.extend({
  classNames: ['build-banner'],
  classNameBindings: ['buildStatus'],
  isPR: match('jobName', /^PR-/),
  jobNames: mapBy('jobs', 'name'),

  buildAction: computed('buildStatus', {
    get() {
      const status = this.get('buildStatus');

      if (status === 'RUNNING' || status === 'QUEUED') {
        return 'Stop';
      }

      return 'Restart';
    }
  }),

  isWaiting: computed('buildStatus', {
    get() {
      return this.get('buildStatus') === 'QUEUED';
    }
  }),

  hasButton: computed('buildAction', 'jobName', {
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

  previous: computed('eventBuilds', 'jobs', 'jobName', {
    get() {
      if (this.get('isPR')) {
        return null;
      }
      const prevIndex = this.get('jobNames').indexOf(this.get('jobName')) - 1;

      return prevIndex < 0 ? null : this.get('eventBuilds').objectAt(prevIndex);
    }
  }),

  next: computed('eventBuilds', 'jobs', 'jobName', {
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

    const status = this.get('buildStatus');

    if (status === 'QUEUED' || status === 'RUNNING') {
      this.get('reloadBuild')();
    }
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
