import Component from '@ember/component';
import { get, set, observer } from '@ember/object';
import moment from 'moment';
import { inject as service } from '@ember/service';
import { toCustomLocaleString } from 'screwdriver-ui/utils/time-range';
import Table from 'ember-light-table';
import isEqual from 'lodash.isequal';

export default Component.extend({
  store: service(),
  shuttle: service(),
  isLoading: false,
  isShowingModal: false,
  sortingDirection: 'asc',
  sortingValuePath: 'job',
  sortedRows: [],
  timestampPreference: null,
  columns: [
    {
      label: 'JOB',
      valuePath: 'job',
      cellComponent: 'pipeline-list-job-cell'
    },
    {
      label: 'HISTORY',
      valuePath: 'history',
      sortable: false,
      cellComponent: 'pipeline-list-history-cell'
    },
    {
      label: 'DURATION',
      sortable: false,
      valuePath: 'duration'
    },
    {
      label: 'START TIME',
      valuePath: 'startTime'
    },
    {
      label: 'COVERAGE',
      valuePath: 'coverage',
      sortable: false,
      cellComponent: 'pipeline-list-coverage-cell'
    },
    {
      label: 'METRICS',
      sortable: false,
      valuePath: 'job',
      cellComponent: 'pipeline-list-metrics-cell'
    },
    {
      label: 'ACTIONS',
      valuePath: 'actions',
      sortable: false,
      cellComponent: 'pipeline-list-actions-cell'
    }
  ],

  init() {
    this._super(...arguments);
    const sortedRows = this.getRows(this.jobsDetails);
    const table = Table.create({
      columns: this.get('columns'),
      rows: sortedRows
    });

    let sortColumn = table
      .get('allColumns')
      .findBy('valuePath', this.get('sortingValuePath'));

    // Setup initial sort column
    if (sortColumn) {
      sortColumn.set('sorted', true);
    }

    this.store
      .findRecord('preference/pipeline', this.get('pipeline.id'))
      .then(pipelinePreference => {
        this.set(
          'timestampPreference',
          pipelinePreference.get('timestampFormat')
        );
      })
      .catch(() => {
        this.set('timestampPreference', null);
      });

    this.setProperties({
      table,
      pipelineParameters: this.getDefaultPipelineParameters(),
      jobParameters: this.getDefaultJobParameters()
    });
  },

  didDestroyElement() {
    this._super(...arguments);
    this.set('jobsDetails', []);
  },

  getDefaultPipelineParameters() {
    return this.getWithDefault('pipeline.parameters', {});
  },

  getDefaultJobParameters() {
    return this.getWithDefault('pipeline.jobParameters', {});
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
    let rows = jobsDetails.map(jobDetails => {
      const { jobId, jobName, annotations, prParentJobId, prNum } = jobDetails;
      const latestBuild = jobDetails.builds.length
        ? get(jobDetails, 'builds.lastObject')
        : null;

      const jobData = {
        jobName,
        build: latestBuild
      };

      const hasParameters =
        Object.keys(this.getWithDefault('pipelineParameters', {})).length > 0 ||
        Object.keys(this.getWithDefault('jobParameters', {})).length > 0;

      let manualStartEnabled = true;

      if (annotations) {
        manualStartEnabled =
          'screwdriver.cd/manualStartEnabled' in annotations
            ? annotations['screwdriver.cd/manualStartEnabled']
            : true;
      }

      const actionsData = {
        jobId,
        jobName,
        latestBuild,
        startSingleBuild: this.get('startSingleBuild'),
        stopBuild: this.get('stopBuild'),
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
          if (this.timestampPreference === 'LOCAL_TIMEZONE') {
            startTime = `${toCustomLocaleString(
              new Date(latestBuild.startTime)
            )}`;
          } else {
            startTime = `${toCustomLocaleString(
              new Date(latestBuild.startTime),
              { timezone: 'UTC' }
            )} UTC`;
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

    const collator = new Intl.Collator('en', {
      numeric: true,
      sensitivity: 'base'
    });

    switch (this.sortingValuePath) {
      case 'job':
        rows.sort((a, b) => collator.compare(a.job.jobName, b.job.jobName));
        break;
      case 'startTime':
        rows.sort((a, b) => {
          const aStartTime = get(a, 'history.lastObject.startTime');
          const bStartTime = get(b, 'history.lastObject.startTime');

          return moment.compare(moment(aStartTime), moment(bStartTime));
        });
        break;
      default:
        break;
    }

    if (this.sortingDirection === 'desc') {
      rows = rows.reverse();
    }

    return rows;
  },
  jobsObserver: observer(
    'jobsDetails.[]',
    function jobsObserverFunc({ jobsDetails }) {
      const rows = this.getRows(jobsDetails);
      const lastRows = get(this, 'lastRows') || [];
      const isEqualRes = isEqual(
        rows
          .map(r => r.job)
          .sort((a, b) => (a.jobName || '').localeCompare(b.jobName)),
        lastRows
          .map(r => r.job)
          .sort((a, b) => (a.jobName || '').localeCompare(b.jobName))
      );

      if (!isEqualRes) {
        set(this, 'lastRows', rows);
        this.table.setRows(rows);
      }
    }
  ),

  actions: {
    async onScrolledToBottom() {
      this.set('isLoading', true);
      this.get('updateListViewJobs')().then(jobs => {
        const rows = this.getRows(jobs);

        this.table.addRows(rows);
        this.set('isLoading', false);
      });
    },

    onColumnClick(column) {
      if (column.sorted) {
        const sortingValuePath = column.get('valuePath');
        const sortingDirection = column.ascending ? 'asc' : 'desc';

        this.setProperties({ sortingDirection, sortingValuePath });

        const sortedRows = this.getRows(this.jobsDetails);

        this.table.setRows(sortedRows);
      }
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
      const buildState = this.get('buildState');
      const job = this.get('job');

      this.startSingleBuild(job.id, job.name, buildState, parameterizedModel);
    }
  }
});
