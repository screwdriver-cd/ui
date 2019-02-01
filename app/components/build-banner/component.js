import { computed } from '@ember/object';
import { alias } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import Component from '@ember/component';
import { isActiveBuild, isPRJob } from 'screwdriver-ui/utils/build';

export default Component.extend({
  classNames: ['build-banner', 'row'],
  classNameBindings: ['buildStatus'],
  coverage: service(),
  coverageStep: computed('buildSteps', {
    get() {
      const buildSteps = this.get('buildSteps');
      const coverageStep = buildSteps.find(item =>
        /^sd-teardown-screwdriver-coverage/.test(item.name));

      return coverageStep;
    }
  }),

  coverageStepEndTime: alias('coverageStep.endTime'),

  prNumber: computed('event.pr.url', {
    get() {
      let url = this.get('event.pr.url');

      return url.split('/').pop();
    }
  }),

  shortenedPrShas: computed('prEvents', {
    get() {
      return this.get('prEvents').then(result =>
        result.map((pr, i) =>
          ({ index: result.length - i,
            shortenedSha: pr.event.sha.substr(0, 6),
            build: pr.build,
            event: pr.event })
        )
      );
    }
  }),

  buildAction: computed('buildStatus', {
    get() {
      if (isActiveBuild(this.get('buildStatus'), this.get('buildEnd'))) {
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

      if (isPRJob(this.get('jobName'))) {
        return true;
      }

      return false;
    }
  }),

  coverageInfoCompute() {
    // Set coverage query startTime to build start time since user can do coverage during user step
    const buildStartTime = this.get('buildSteps')[0].startTime;
    const coverageStepEndTime = this.get('coverageStepEndTime');

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
      startTime: buildStartTime,
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
    this.set('showDurationDetail', false);

    this.coverageInfoCompute();
  },

  willRender() {
    this._super(...arguments);

    if (isActiveBuild(this.get('buildStatus'), this.get('buildEnd'))) {
      this.get('reloadBuild')();
    }

    if (this.get('coverageStepEndTime') && !this.get('coverageInfoSet')) {
      this.coverageInfoCompute();
    }
  },

  actions: {

    changeCurPr(targetPr) {
      let changeBuild = this.get('changeBuild');

      changeBuild(targetPr.event.pipelineId, targetPr.build.id);
    },

    buildButtonClick() {
      if (this.get('buildAction') === 'Stop') {
        this.get('onStop')();
      } else {
        this.get('onStart')();
      }
    },

    toggleDurationDetail() {
      this.set('showDurationDetail', !this.get('showDurationDetail'));
    }
  }
});
