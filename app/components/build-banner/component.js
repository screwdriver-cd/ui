import { set, computed, observer } from '@ember/object';
import { alias } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import Component from '@ember/component';
import { isActiveBuild, isPRJob } from 'screwdriver-ui/utils/build';
import PromiseProxyMixin from '@ember/object/promise-proxy-mixin';
import ObjectProxy from '@ember/object/proxy';
import { getTimestamp } from '../../utils/timestamp-format';
import {
  isValidHttpOrHttpsUrl,
  isValidRelativePath,
  getPipelineBuildUrl
} from '../../utils/url';

const ObjectPromiseProxy = ObjectProxy.extend(PromiseProxyMixin);

export default Component.extend({
  newUi: false,
  userSettings: service(),
  shuttle: service(),
  classNames: ['build-banner', 'grid'],
  classNameBindings: ['buildStatus'],
  shouldSkipNextNotify: false,
  showBuildActionModal: false,
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
  buildNotify: observer('buildStatus', function buildNotify() {
    // Not to be notified when transitioning from a commit dropdown to another build
    if (this.shouldSkipNextNotify) {
      this.set('shouldSkipNextNotify', false);

      return;
    }

    if (Notification.permission === 'granted' && this.allowNotification) {
      if (['SUCCESS', 'FAILURE', 'ABORTED'].includes(this.buildStatus)) {
        const screwdriverIconPath = '/assets/icons/android-chrome-144x144.png';
        const statusMap = {
          SUCCESS: '✅',
          FAILURE: '❌',
          ABORTED: '⛔'
        };

        const notificationIcon = statusMap[this.buildStatus];

        // eslint-disable-next-line no-new
        new Notification(`SD.cd ${this.pipelineName}`, {
          body: `${notificationIcon} ${this.buildStatus}: ${this.jobName}`,
          icon: screwdriverIconPath
        }).onclick = () => {
          window.focus();
        };
      }
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

  costMetrics: computed('buildId', 'buildMeta', {
    get() {
      const { buildId, buildMeta } = this;

      return buildMeta?.build?.cost_metrics?.[buildId];
    }
  }),

  buildCpu: computed('buildId', 'buildMeta', {
    get() {
      const { buildId, buildMeta } = this;
      const cpu = buildMeta?.build?.cost_metrics?.[buildId].cpu;

      return cpu ? String(`${cpu} vCPU`) : '';
    }
  }),

  buildMemory: computed('buildId', 'buildMeta', {
    get() {
      const { buildId, buildMeta } = this;
      const memory = buildMeta?.build?.cost_metrics?.[buildId].memory;

      return memory ? String(`${memory} GiB`) : '';
    }
  }),

  buildCost: computed('buildId', 'buildMeta', {
    get() {
      const { buildId, buildMeta } = this;
      const cost = buildMeta?.build?.cost_metrics?.[buildId].cost;

      return cost ? String(`$${cost.toFixed(4)}`) : '';
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
      const pipelineBuildUrlMatch = getPipelineBuildUrl();

      if (coverageFloat) {
        coverageInfo.coverage = `${coverageFloat}%`;
        coverageInfo.coverageUrl = '#';
      }

      if (coverageUrl) {
        if (isValidHttpOrHttpsUrl(coverageUrl)) {
          coverageInfo.coverageUrl = coverageUrl;
        }

        if (isValidRelativePath(coverageUrl) && pipelineBuildUrlMatch) {
          coverageInfo.coverageUrl = `${pipelineBuildUrlMatch[0]}/artifacts${coverageUrl}`;
        }
      }

      if (String(tests).match(/^\d+\/\d+$/)) {
        coverageInfo.tests = tests;
        coverageInfo.testsUrl = '#';
      }

      if (testsUrl) {
        if (isValidHttpOrHttpsUrl(testsUrl)) {
          coverageInfo.testsUrl = testsUrl;
        }

        if (isValidRelativePath(testsUrl) && pipelineBuildUrlMatch) {
          coverageInfo.testsUrl = `${pipelineBuildUrlMatch[0]}/artifacts${testsUrl}`;
        }
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
    this.userSettings
      .getAllowNotification()
      .then(allowNotification => {
        this.set('allowNotification', allowNotification);
      })
      .catch(() => {
        this.set('allowNotification', false);
      });

    if (localStorage.getItem('newUI') === 'true') {
      this.set('newUi', true);
    }
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
      if (Number(this.buildId) !== targetPr.build.id) {
        this.set('shouldSkipNextNotify', true);
      }
      this.changeBuild(targetPr.event.pipelineId, targetPr.build.id);
    },

    buildActionButtonClick() {
      this.set('showBuildActionModal', false);
      if (this.buildAction === 'Stop') {
        this.onStop();
      } else {
        this.onStart();
      }
    },

    openBuildActionModal() {
      this.set('showBuildActionModal', true);
    },

    closeBuildActionModal() {
      this.set('showBuildActionModal', false);
    }
  }
});
