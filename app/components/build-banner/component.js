import { computed } from '@ember/object';
import { match } from '@ember/object/computed';
import Component from '@ember/component';

export default Component.extend({
  classNames: ['build-banner', 'row'],
  classNameBindings: ['buildStatus'],
  isPR: match('jobName', /^PR-/),

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

  willRender() {
    this._super(...arguments);

    const status = this.get('buildStatus');

    if (status === 'QUEUED' || status === 'RUNNING') {
      this.get('reloadBuild')();
    }
  },

  actions: {
    buildButtonClick() {
      if (this.get('buildAction') === 'Stop') {
        this.get('onStop')();
      } else {
        this.get('onStart')();
      }
    }
  }
});
