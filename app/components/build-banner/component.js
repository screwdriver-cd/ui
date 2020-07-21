import { computed } from '@ember/object';
import { alias } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import Component from '@ember/component';
import { isActiveBuild, isPRJob } from 'screwdriver-ui/utils/build';

export default Component.extend({
  classNames: ['build-banner', 'row'],
  classNameBindings: ['buildStatus'],
  coverage: service(),
  coverageInfo: {},
  coverageStep: computed('buildSteps', {
    get() {
      const coverageStep = this.buildSteps.find(item =>
        /^sd-teardown-screwdriver-coverage/.test(item.name)
      );

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
      return this.prEvents.then(result =>
        result.map((pr, i) => ({
          index: result.length - i,
          shortenedSha: pr.event.sha.substr(0, 7),
          build: pr.build,
          event: pr.event
        }))
      );
    }
  }),

  buildAction: computed('buildStatus', {
    get() {
      if (isActiveBuild(this.buildStatus, this.buildEnd)) {
        return 'Stop';
      }

      return 'Restart';
    }
  }),

  isWaiting: computed('buildStatus', {
    get() {
      return this.buildStatus === 'QUEUED';
    }
  }),

  hasButton: computed('buildAction', 'jobName', {
    get() {
      if (this.buildAction === 'Stop') {
        return true;
      }

      if (isPRJob(this.jobName)) {
        return true;
      }

      return false;
    }
  }),

  overrideCoverageInfo() {
    const { buildMeta } = this;

    // override coverage info if set in build meta
    if (buildMeta && buildMeta.tests) {
      const { coverage, coverageUrl, results: tests, resultsUrl: testsUrl } = buildMeta.tests;
      const BUILD_URL_REGEX = /^.+\/pipelines\/\d+\/builds\/\d+/;
      const buildUrl = window.location.href.match(BUILD_URL_REGEX);
      const coverageFloat = parseFloat(coverage) ? Number(parseFloat(coverage).toFixed(2)) : null;

      let coverageInfo = Object.assign({}, this.get('coverageInfo'));

      if (coverageFloat) {
        coverageInfo.coverage = `${coverageFloat}%`;
        coverageInfo.coverageUrl = '#';
      }

      if (String(coverageUrl).match(/^(\/[^/]+)+$/) && buildUrl) {
        coverageInfo.coverageUrl = `${buildUrl[0]}/artifacts${coverageUrl}`;
      }

      if (String(tests).match(/^\d+\/\d+$/)) {
        coverageInfo.tests = tests;
        coverageInfo.testsUrl = '#';
      }

      if (String(testsUrl).match(/^(\/[^/]+)+$/) && buildUrl) {
        coverageInfo.testsUrl = `${buildUrl[0]}/artifacts${testsUrl}`;
      }

      this.set('coverageInfo', coverageInfo);
    }
  },

  coverageInfoCompute() {
    // Set coverage query startTime to build start time since user can do coverage during user step
    const buildStartTime = this.buildSteps[0].startTime;
    const { coverageStepEndTime } = this;

    if (!coverageStepEndTime) {
      this.set('coverageInfo', {
        coverage: 'N/A',
        coverageUrl: '#',
        tests: 'N/A',
        testsUrl: '#'
      });

      return;
    }

    const config = {
      buildId: this.buildId,
      jobId: this.jobId,
      startTime: buildStartTime,
      endTime: coverageStepEndTime,
      pipelineId: this.pipelineId,
      prNum: this.prNumber
    };

    this.coverage.getCoverageInfo(config).then(data => {
      this.set('coverageInfo', data);
      this.set('coverageInfoSet', true);
    });
  },

  init() {
    this._super(...arguments);

    this.set('coverageInfoSet', false);

    this.coverageInfoCompute();
    this.overrideCoverageInfo();
  },

  willRender() {
    this._super(...arguments);

    if (isActiveBuild(this.buildStatus, this.buildEnd)) {
      this.reloadBuild();
    }

    if (this.coverageStepEndTime && !this.coverageInfoSet) {
      this.coverageInfoCompute();
    }

    if (!isActiveBuild(this.buildStatus, this.buildEnd)) {
      this.overrideCoverageInfo();
    }
  },

  actions: {
    changeCurPr(targetPr) {
      this.changeBuild(targetPr.event.pipelineId, targetPr.build.id);
    },

    buildButtonClick() {
      if (this.buildAction === 'Stop') {
        this.onStop();
      } else {
        this.onStart();
      }
    }
  }
});
