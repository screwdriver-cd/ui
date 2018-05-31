import { computed } from '@ember/object';
import { alias, match } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import Component from '@ember/component';

export default Component.extend({
  classNames: ['build-banner', 'row'],
  classNameBindings: ['buildStatus'],
  coverage: service(),
  isPR: match('jobName', /^PR-/),
  coverageStep: computed('buildSteps', {
    get() {
      const buildSteps = this.get('buildSteps');
      const coverageStep = buildSteps.find(item =>
        /^sd-teardown-screwdriver-coverage/.test(item.name));

      return coverageStep;
    }
  }),

  coverageStepEndTime: alias('coverageStep.endTime'),

  coverageStepStartTime: alias('coverageStep.startTime'),

  prNumber: computed('event.pr.url', {
    get() {
      let url = this.get('event.pr.url');

      return url.split('/').pop();
    }
  }),

  shortenedPrShas: computed('prEvents', {
    get() {
      return this.get('prEvents').then((result) => {
        let shortenedPrs = [];
        let i = 1;
        result.forEach((pr) => {
          shortenedPrs.push([i++, pr.sha.substr(0, 6)]);
        });

        return shortenedPrs;
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

  coverageInfoCompute() {
    const coverageStepEndTime = this.get('coverageStepEndTime');
    const coverageStepStartTime = this.get('coverageStepStartTime');

    if (!coverageStepEndTime) {
      this.set('coverageInfo', {
        projectUrl: '#',
        coverage: 'N/A'
      });

      return;
    }

    const config = {
      buildId: this.get('buildId'),
      jobId: this.get('jobId'),
      startTime: coverageStepStartTime,
      endTime: coverageStepEndTime
    };

    this.get('coverage').getCoverageInfo(config)
      .then((data) => {
        this.set('coverageInfo', data);
        this.set('coverageInfoSet', true);
      });
  },

  init() {
    this._super(...arguments);

    this.set('coverageInfoSet', false);

    this.coverageInfoCompute();
  },

  willRender() {
    this._super(...arguments);

    const status = this.get('buildStatus');

    if (status === 'QUEUED' || status === 'RUNNING') {
      this.get('reloadBuild')();
    }

    if (this.get('coverageStepEndTime') && !this.get('coverageInfoSet')) {
      this.coverageInfoCompute();
    }
  },

  actions: {

    changeCurPr(pr) {
      const prs = this.get('prEvents')._result;
      let changeBuild = this.get('changeBuild');

      for (let i = 0; i < prs.length; i += 1) {
        if (pr === prs[i].sha.substr(0, 6)) {
          changeBuild(prs[i].pipelineId, prs[i].id);
          break;
        }
      }
    },

    buildButtonClick() {
      if (this.get('buildAction') === 'Stop') {
        this.get('onStop')();
      } else {
        this.get('onStart')();
      }
    }
  }
});
