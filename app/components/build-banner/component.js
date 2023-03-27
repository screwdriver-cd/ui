import { set, computed } from '@ember/object';
import { alias } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import Component from '@ember/component';
import { isActiveBuild, isPRJob } from 'screwdriver-ui/utils/build';
import PromiseProxyMixin from '@ember/object/promise-proxy-mixin';
import ObjectProxy from '@ember/object/proxy';
import { getTimestamp } from '../../utils/timestamp-format';
import { isValidHttpOrHttpsUrl } from '../../utils/url-regex';

const ObjectPromiseProxy = ObjectProxy.extend(PromiseProxyMixin);

export default Component.extend({
  userSettings: service(),
  shuttle: service(),
  classNames: ['build-banner', 'grid'],
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

  prNumber: computed('_prNumber', 'event.pr.url', {
    get() {
      if (this._prNumber) {
        return this._prNumber;
      }

      const url =
        this.get('event.pr.url') === undefined ? '' : this.get('event.pr.url');

      return url.split('/').pop();
    },
    set(_, value) {
      set(this, '_prNumber', value);

      return value;
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

  buildAction: computed('buildEnd', 'buildStatus', {
    get() {
      if (isActiveBuild(this.buildStatus, this.buildEnd)) {
        return 'Stop';
      }

      return 'Restart';
    }
  }),
  buildCreateTime: computed('buildCreate', {
    get() {
      let createTime = 'n/a';

      createTime = getTimestamp(this.userSettings, this.buildCreate);

      return createTime;
    }
  }),

  template: computed('templateId', {
    get() {
      const templateId = this.get('templateId');

      return ObjectPromiseProxy.create({
        promise: this.shuttle.getTemplateDetails(templateId).then(template => {
          const usageTemplate = {
            name: template.name,
            namespace: template.namespace,
            version: template.version
          };

          return usageTemplate;
        })
      });
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

  isButtonDisabledLoaded: false,
  isButtonDisabled: computed(
    'buildAction',
    'buildStatus',
    'jobDisabled',
    'pipelineState',
    {
      get() {
        if (this.buildAction === 'Restart') {
          if (this.pipelineState === 'INACTIVE') {
            this.set('isButtonDisabledLoaded', true);

            return true;
          }

          return this.jobDisabled.then(jobDisabled => {
            this.set('isButtonDisabledLoaded', true);

            return jobDisabled;
          });
        }

        this.set('isButtonDisabledLoaded', true);

        return false;
      }
    }
  ),

  overrideCoverageInfo() {
    const { buildMeta } = this;

    // override coverage info if set in build meta
    if (buildMeta && buildMeta.tests) {
      let testOutput = buildMeta.tests;
      const { sonarqube, saucelabs } = buildMeta.tests;

      if (saucelabs) {
        testOutput = saucelabs;
      } else if (sonarqube) {
        testOutput = sonarqube;
      }

      const {
        coverage,
        coverageUrl,
        results: tests,
        resultsUrl: testsUrl
      } = testOutput;

      const coverageFloat = parseFloat(coverage)
        ? Number(parseFloat(coverage).toFixed(2))
        : null;

      const coverageInfo = { ...this.coverageInfo };

      if (coverageFloat) {
        coverageInfo.coverage = `${coverageFloat}%`;
        coverageInfo.coverageUrl = '#';
      }

      if (coverageUrl && isValidHttpOrHttpsUrl(coverageUrl)) {
        coverageInfo.coverageUrl = coverageUrl;
      }

      if (String(tests).match(/^\d+\/\d+$/)) {
        coverageInfo.tests = tests;
        coverageInfo.testsUrl = '#';
      }

      if (testsUrl && isValidHttpOrHttpsUrl(testsUrl)) {
        coverageInfo.testsUrl = testsUrl;
      }

      this.set('coverageInfo', coverageInfo);
    }
  },

  coverageInfoCompute() {
    // Set coverage query startTime to build start time since user can do coverage during user step
    const buildStartTime = this.buildSteps[0].startTime;
    const { coverageStepEndTime, buildMeta } = this;

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
      prNum: this.prNumber,
      jobName: this.jobName,
      pipelineName: this.pipelineName,
      projectKey: buildMeta.build?.coverageKey || null
    };

    if (this.annotations && this.annotations['screwdriver.cd/coverageScope']) {
      config.scope = this.annotations['screwdriver.cd/coverageScope'];
    }

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
