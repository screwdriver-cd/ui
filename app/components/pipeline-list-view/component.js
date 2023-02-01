import Component from '@ember/component';
import { get, set, observer } from '@ember/object';
import moment from 'moment';
import { inject as service } from '@ember/service';
import { toCustomLocaleString } from 'screwdriver-ui/utils/time-range';
import isEqual from 'lodash.isequal';
import { isActivePipeline } from 'screwdriver-ui/utils/pipeline';

const collator = new Intl.Collator('en', {
  numeric: true,
  sensitivity: 'base'
});

export default Component.extend({
  store: service(),
  userSettings: service(),
  theme: service('emt-themes/ember-bootstrap-v4'),
  isLoading: false,
  isShowingModal: false,
  data: [],
  timestampPreference: null,
  columns: [
    {
      title: 'JOB',
      propertyName: 'job',
      component: 'pipeline-list-job-cell',
      sortFunction: (a, b) => collator.compare(a.jobName, b.jobName)
    },
    {
      title: 'HISTORY',
      propertyName: 'history',
      disableSorting: true,
      component: 'pipeline-list-history-cell'
    },
    {
      title: 'DURATION',
      propertyName: 'duration',
      disableSorting: true
    },
    {
      title: 'START TIME',
      propertyName: 'startTime',
      sortedBy: 'history',
      sortFunction: (a, b) => {
        const aStartTime = get(a, 'lastObject.startTime');
        const bStartTime = get(b, 'lastObject.startTime');

        return moment.compare(moment(aStartTime), moment(bStartTime));
      }
    },
    {
      title: 'COVERAGE',
      propertyName: 'coverage',
      disableSorting: true,
      component: 'pipeline-list-coverage-cell'
    },
    {
      title: 'METRICS',
      propertyName: 'job',
      disableSorting: true,
      component: 'pipeline-list-metrics-cell'
    },
    {
      title: 'ACTIONS',
      propertyName: 'actions',
      disableSorting: true,
      component: 'pipeline-list-actions-cell'
    }
  ],

  async init() {
    this._super(...arguments);
    const rows = this.getRows(this.jobsDetails);

    this.theme.table = 'table table-condensed table-sm';

    this.userSettings
      .getTimestampFormat()
      .then(timestampFormat => {
        this.set('timestampPreference', timestampFormat);
      })
      .catch(() => {
        this.set('timestampPreference', null);
      });

    this.setProperties({
      data: rows,
      pipelineParameters: this.getDefaultPipelineParameters(),
      jobParameters: this.getDefaultJobParameters()
    });
  },

  didDestroyElement() {
    this._super(...arguments);
    this.set('jobsDetails', []);
  },

  getDefaultPipelineParameters() {
    return this.get('pipeline.parameters') === undefined
      ? {}
      : this.get('pipeline.parameters');
  },

  getDefaultJobParameters() {
    return this.get('pipeline.jobParameters') === undefined
      ? {}
      : this.get('pipeline.jobParameters');
  },

  /**
   * Note: jobId must be a string
   * @param  {integer} jobId
   * @return {undefined}
   */
  openParametersModal(jobId, buildState) {
    const job = this.jobs.findBy('id', `${jobId}`);

    this.setProperties({
      job,
      buildState,
      isShowingModal: true
    });
  },

  getDuration(startTime, endTime, status) {
    const startDateTime = Date.parse(startTime);
    const endDateTime = Date.parse(endTime);
    const humanizeConfig = {
      round: true,
      delimiter: ' ',
      spacer: '',
      units: ['h', 'm', 's'],
      language: 'shortEn',
      languages: {
        shortEn: { h: () => 'h', m: () => 'm', s: () => 's' }
      }
    };

    if (!startDateTime) {
      return null;
    }
    if (!endDateTime) {
      if (
        ['CREATED', 'RUNNING', 'QUEUED', 'BLOCKED', 'FROZEN'].includes(status)
      ) {
        return 'Still running.';
      }

      return null;
    }

    const duration = endDateTime - startDateTime;

    if (duration < 60000) {
      return `0h 0m ${humanizeDuration(duration, humanizeConfig)}`;
    }

    if (duration < 3600000) {
      return `0h ${humanizeDuration(duration, humanizeConfig)}`;
    }

    return humanizeDuration(duration, humanizeConfig);
  },

  getRows(jobsDetails = []) {
    const rows = jobsDetails.map(jobDetails => {
      const { jobId, jobName, annotations, prParentJobId, prNum } = jobDetails;
      const latestBuild = jobDetails.builds.length
        ? get(jobDetails, 'builds.lastObject')
        : null;

      const jobData = {
        jobName,
        build: latestBuild
      };

      const hasParameters =
        Object.keys(
          this.pipelineParameters === undefined ? {} : this.pipelineParameters
        ).length > 0 ||
        Object.keys(this.jobParameters === undefined ? {} : this.jobParameters)
          .length > 0;

      let manualStartEnabled = isActivePipeline(this.get('pipeline'));

      if (manualStartEnabled && annotations) {
        manualStartEnabled =
          'screwdriver.cd/manualStartEnabled' in annotations
            ? annotations['screwdriver.cd/manualStartEnabled']
            : true;
      }

      const actionsData = {
        jobId,
        jobName,
        latestBuild,
        startSingleBuild: this.startSingleBuild,
        stopBuild: this.stopBuild,
        isShowingModal: this.isShowingModal,
        hasParameters,
        openParametersModal: this.openParametersModal.bind(this),
        manualStartEnabled
      };

      let duration;

      let startTime;

      let buildId;

      let coverageData = {};

      if (latestBuild) {
        if (latestBuild.startTime) {
          if (this.timestampPreference === 'UTC') {
            startTime = `${toCustomLocaleString(
              new Date(latestBuild.startTime),
              { timeZone: 'UTC' }
            )}`;
          } else {
            startTime = `${toCustomLocaleString(
              new Date(latestBuild.startTime)
            )}`;
          }
        } else {
          startTime = 'Invalid date';
        }
        buildId = latestBuild.id;
        duration = this.getDuration(
          latestBuild.startTime,
          latestBuild.endTime,
          latestBuild.status
        );

        coverageData = {
          jobId,
          buildId,
          startTime: latestBuild.startTime,
          endTime: latestBuild.endTime,
          pipelineId: latestBuild.pipelineId,
          prNum,
          jobName,
          pipelineName: this.get('pipeline.name'),
          prParentJobId,
          projectKey: latestBuild.meta?.build?.coverageKey
        };

        if (annotations && annotations['screwdriver.cd/coverageScope']) {
          coverageData.scope = annotations['screwdriver.cd/coverageScope'];
        }
      }

      return {
        job: jobData,
        startTime: startTime === 'Invalid date' ? 'Not started.' : startTime,
        duration: duration === null ? 'N/A' : duration,
        history: jobDetails.builds,
        actions: actionsData,
        coverage: coverageData
      };
    });

    return rows;
  },
  jobsObserver: observer(
    'jobsDetails.[]',
    function jobsObserverFunc({ jobsDetails }) {
      const rows = this.getRows(jobsDetails);
      const lastRows = this.lastRows || [];
      const isEqualRes = isEqual(
        rows
          .map(r => r.job)
          .sort((a, b) => (a.jobName || '').localeCompare(b.jobName)),
        lastRows
          .map(r => r.job)
          .sort((a, b) => (a.jobName || '').localeCompare(b.jobName))
      );

      if (!isEqualRes) {
        set(this, 'lastRows', lastRows);
        this.set('data', rows);
      }
    }
  ),

  actions: {
    async onScrolledToBottom() {
      this.set('isLoading', true);
      const jobs = await this.updateListViewJobs();
      const rows = this.getRows(jobs);

      this.set('data', rows);
      this.set('isLoading', false);
    },

    closeModal() {
      this.set('isShowingModal', false);
    },

    resetForm() {
      this.setProperties({
        isShowingModal: false,
        pipelineParameters: this.getDefaultPipelineParameters(),
        jobParameters: this.getDefaultJobParameters()
      });
    },

    startBuild(parameterizedModel) {
      const { buildState } = this;
      const { job } = this;

      this.startSingleBuild(job.id, job.name, buildState, parameterizedModel);
    }
  }
});
