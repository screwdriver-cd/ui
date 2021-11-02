import { tagName } from '@ember-decorators/component';
import classic from 'ember-classic-decorator';
import { observes } from '@ember-decorators/object';
import Component from '@ember/component';
import { set, action } from '@ember/object';
import moment from 'moment';
import { toCustomLocaleString } from 'screwdriver-ui/utils/time-range';
import Table from 'ember-light-table';
import isEqual from 'lodash.isequal';

@tagName('')
@classic
export default class PipelineListView extends Component {
  isLoading = false;

  isShowingModal = false;

  sortingDirection = 'asc';

  sortingValuePath = 'job';

  sortedRows = [];

  columns = [
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
  ];

  init() {
    super.init(...arguments);
    const sortedRows = this.getRows(this.jobsDetails);
    const table = Table.create({
      columns: this.columns,
      rows: sortedRows
    });

    let sortColumn = table.allColumns.findBy(
      'valuePath',
      this.sortingValuePath
    );

    // Setup initial sort column
    if (sortColumn) {
      sortColumn.set('sorted', true);
    }

    this.setProperties({
      table,
      pipelineParameters: this.getDefaultPipelineParameters(),
      jobParameters: this.getDefaultJobParameters()
    });
  }

  didDestroyElement() {
    super.didDestroyElement(...arguments);
    this.set('jobsDetails', []);
  }

  getDefaultPipelineParameters() {
    return this.pipeline?.parameters || {};
  }

  getDefaultJobParameters() {
    return this.pipeline?.jobParameters || {};
  }

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
  }

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
  }

  getRows(jobsDetails = []) {
    let rows = jobsDetails.map(jobDetails => {
      const { jobId, jobName, annotations, prParentJobId, prNum } = jobDetails;
      const latestBuild = jobDetails.builds.length
        ? jobDetails.builds[jobDetails.builds.length - 1]
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

      const actionsData = {
        jobId,
        jobName,
        latestBuild,
        startSingleBuild: this.startSingleBuild,
        stopBuild: this.stopBuild,
        isShowingModal: this.isShowingModal,
        hasParameters,
        openParametersModal: this.openParametersModal.bind(this)
      };

      let duration;

      let startTime;

      let buildId;

      let coverageData = {};

      if (latestBuild) {
        startTime = latestBuild.startTime
          ? `${toCustomLocaleString(new Date(latestBuild.startTime))}`
          : 'Invalid date';
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
          pipelineName: this.pipeline.name,
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
          const aStartTime = a.history[a.history.length - 1].startTime;
          const bStartTime = b.history[b.history.length - 1].startTime;

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
  }

  @observes('jobsDetails.[]')
  jobsObserver({ jobsDetails }) {
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
      set(this, 'lastRows', rows);
      this.table.setRows(rows);
    }
  }

  @action
  async onScrolledToBottom() {
    this.set('isLoading', true);
    this.updateListViewJobs().then(jobs => {
      const rows = this.getRows(jobs);

      this.table.addRows(rows);
      this.set('isLoading', false);
    });
  }

  @action
  onColumnClick(column) {
    if (column.sorted) {
      const sortingValuePath = column.valuePath;
      const sortingDirection = column.ascending ? 'asc' : 'desc';

      this.setProperties({ sortingDirection, sortingValuePath });

      const sortedRows = this.getRows(this.jobsDetails);

      this.table.setRows(sortedRows);
    }
  }

  @action
  closeModal() {
    this.set('isShowingModal', false);
  }

  @action
  resetForm() {
    this.setProperties({
      isShowingModal: false,
      pipelineParameters: this.getDefaultPipelineParameters(),
      jobParameters: this.getDefaultJobParameters()
    });
  }

  @action
  startBuild(parameterizedModel) {
    const { buildState } = this;
    const { job } = this;

    this.startSingleBuild(job.id, job.name, buildState, parameterizedModel);
  }
}
