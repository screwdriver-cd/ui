import Component from '@ember/component';
import { get } from '@ember/object';
import moment from 'moment';
import Table from 'ember-light-table';

export default Component.extend({
  isShowingModal: false,
  sortingDirection: 'asc',
  sortingValuePath: 'job',
  sortedRows: [],
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
      label: 'ACTIONS',
      valuePath: 'actions',
      sortable: false,
      cellComponent: 'pipeline-list-actions-cell'
    }
  ],

  init() {
    this._super(...arguments);
    const sortedRows = this.getRows(this.jobsDetails);
    const table = new Table(this.get('columns'), sortedRows);
    let sortColumn = table.get('allColumns').findBy('valuePath', this.get('sortingValuePath'));

    // Setup initial sort column
    if (sortColumn) {
      sortColumn.set('sorted', true);
    }

    this.setProperties({
      table,
      buildParameters: this.getDefaultBuildParameters()
    });
  },

  didDestroyElement() {
    this._super(...arguments);
    this.set('jobsDetails', []);
  },

  getDefaultBuildParameters() {
    return this.getWithDefault('pipeline.parameters', {});
  },

  /**
   * Note: jobId must be a string
   * @param  {integer} jobId
   * @return {undefined}
   */
  openParametersModal(jobId) {
    const job = this.jobs.findBy('id', `${jobId}`);

    this.setProperties({
      job,
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
      if (['CREATED', 'RUNNING', 'QUEUED', 'BLOCKED', 'FROZEN'].includes(status)) {
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
      const { jobId, jobName, annotations } = jobDetails;
      const latestBuild = jobDetails.builds.length ? get(jobDetails, 'builds.lastObject') : null;

      const jobData = {
        jobName,
        build: latestBuild
      };

      const actionsData = {
        jobId,
        jobName,
        latestBuild,
        startSingleBuild: this.get('startSingleBuild'),
        stopBuild: this.get('stopBuild'),
        isShowingModal: this.isShowingModal,
        hasParameters: Object.keys(this.get('buildParameters')).length > 0,
        openParametersModal: this.openParametersModal.bind(this)
      };

      const prRegex = /^PR-(\d+)(?::([\w-]+))?$/;
      const prNumMatch = jobName.match(prRegex);

      let duration;
      let startTime;
      let status;
      let buildId;
      let coverageData = {};

      if (latestBuild) {
        startTime = moment(latestBuild.startTime).format('lll');
        status = latestBuild.status;
        buildId = latestBuild.id;
        duration = this.getDuration(latestBuild.startTime, latestBuild.endTime, status);

        coverageData = {
          jobId,
          buildId,
          startTime: latestBuild.startTime,
          endTime: latestBuild.endTime,
          pipelineId: latestBuild.pipelineId,
          prNum: prNumMatch && prNumMatch.length > 1 ? prNumMatch[1] : null,
          jobName,
          pipelineName: this.get('pipeline.name')
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

    const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });

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

  actions: {
    async onScrolledToBottom() {
      this.get('updateListViewJobs')().then(jobs => {
        const rows = this.getRows(jobs);

        this.table.addRows(rows);
      });
    },

    refreshListViewJobs() {
      this.get('refreshListViewJobs')().then(jobs => {
        const rows = this.getRows(jobs);

        this.table.setRows(rows);
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
        buildParameters: this.getDefaultBuildParameters()
      });
    },

    startBuild(parameterizedModel) {
      this.startDetachedBuild(this.job, parameterizedModel);
    }
  }
});
