import { computed } from '@ember/object';
import { match, filter } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import Component from '@ember/component';
import PromiseProxyMixin from '@ember/object/promise-proxy-mixin';
import ObjectProxy from '@ember/object/proxy';

const ObjectPromiseProxy = ObjectProxy.extend(PromiseProxyMixin);

export default Component.extend({
  classNames: ['build-banner', 'row'],
  classNameBindings: ['buildStatus'],
  coverage: service(),
  isPR: match('jobName', /^PR-/),
  coverageStep: filter('buildSteps', item => /^sd-teardown-screwdriver-coverage/.test(item.name)),

  coverageInfo: computed('coverageStep', {
    get() {
      const coverageStep = this.get('coverageStep');

      // No coverage step, return empty object
      if (!coverageStep || coverageStep.length <= 0) {
        return {};
      }

      const coverageStepData = coverageStep.objectAt(0);

      // Coverage step not finished yet, return place holder value
      if (!coverageStepData.endTime) {
        return {
          coverage: 'N/A',
          projectUrl: '#'
        };
      }

      const config = {
        buildId: this.get('buildId'),
        jobId: this.get('jobId'),
        startTime: coverageStepData.startTime,
        endTime: coverageStepData.endTime
      };

      return ObjectPromiseProxy.create({
        promise: this.get('coverage').getCoverageInfo(config)
      });
    }
  }),

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
