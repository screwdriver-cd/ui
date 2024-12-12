import Component from '@glimmer/component';
import { service } from '@ember/service';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { dom } from '@fortawesome/fontawesome-svg-core';
import DataReloader from './dataReloader';
import getDisplayName from './util';

const INITIAL_PAGE_SIZE = 10;

export default class PipelineJobsTableComponent extends Component {
  @service shuttle;

  @service workflowDataReload;

  @service('emt-themes/ember-bootstrap-v5') emberModelTableBootstrapTheme;

  pipeline;

  userSettings;

  event;

  jobs;

  dataReloader;

  numBuilds;

  @tracked data;

  columns = [
    {
      title: 'JOB',
      propertyName: 'jobName',
      className: 'job-column',
      component: 'jobCell',
      filteredBy: 'jobName'
    },
    {
      title: 'HISTORY',
      propertyName: 'history',
      className: 'history-column',
      component: 'historyCell',
      filterFunction: async (_, filterVal) => {
        await this.dataReloader.setNumBuilds(filterVal);
      },
      filterWithSelect: true,
      predefinedFilterOptions: ['5', '10', '15', '20', '25', '30']
    },
    {
      title: 'DURATION',
      className: 'duration-column',
      component: 'durationCell'
    },
    {
      title: 'START TIME',
      className: 'start-time-column',
      component: 'startTimeCell'
    },
    {
      title: 'COVERAGE',
      className: 'coverage-column',
      component: 'coverageCell'
    },
    {
      title: 'STAGE',
      propertyName: 'stageName',
      className: 'stage-column',
      component: 'stageCell',
      filteredBy: 'stageName'
    },
    {
      title: 'METRICS',
      className: 'metrics-column',
      component: 'metricsCell'
    },
    {
      title: 'ACTIONS',
      className: 'actions-column',
      component: 'actionsCell'
    }
  ];

  constructor() {
    super(...arguments);

    this.pipeline = this.args.pipeline;
    this.event = this.args.event;
    this.jobs = this.args.jobs;
    this.userSettings = this.args.userSettings;
    this.numBuilds = this.args.numBuilds;
    this.data = null;
  }

  willDestroy() {
    super.willDestroy();

    this.dataReloader.stop(this.event?.id);
  }

  @action
  initialize(element) {
    dom.i2svg({ node: element });
    this.initializeDataLoader().then(() => {});
  }

  @action
  async initializeDataLoader() {
    const prNum = this.event?.prNum;

    if (prNum) {
      this.jobs = this.workflowDataReload.getJobsForPr(prNum);
    }

    const jobIds = this.jobs.map(job => job.id);

    this.dataReloader = new DataReloader(
      { shuttle: this.shuttle, workflowDataReload: this.workflowDataReload },
      jobIds,
      INITIAL_PAGE_SIZE,
      this.numBuilds
    );

    this.data = [];

    this.jobs.forEach(job => {
      this.data.push({
        job,
        jobName: getDisplayName(job, prNum),
        stageName: job?.permutations?.[0]?.stage?.name || 'N/A',
        pipeline: this.pipeline,
        jobs: this.jobs,
        timestampFormat: this.userSettings.timestampFormat,
        onCreate: (jobToMonitor, buildsCallback) => {
          this.dataReloader.addCallbackForJobId(
            jobToMonitor.id,
            buildsCallback
          );
        },
        onDestroy: jobToMonitor => {
          this.dataReloader.removeCallbacksForJobId(jobToMonitor.id);
        }
      });
    });

    const eventId = this.event?.id;

    if (!eventId) {
      const initialJobIds = this.dataReloader.newJobIds();

      await this.dataReloader.fetchBuildsForJobs(initialJobIds);
    }

    this.dataReloader.start(eventId);
  }

  @action
  update(element, [event]) {
    this.data = [];

    if (event) {
      this.dataReloader.stop(this.event?.id);
      this.event = event;
    }

    this.initializeDataLoader().then(() => {});
  }

  get theme() {
    const theme = this.emberModelTableBootstrapTheme;

    theme.table = 'table table-condensed table-hover table-sm';

    return theme;
  }

  @action
  onDisplayDataChanged(data) {
    const jobIds = data.filteredContent.map(record => record.job.id);

    this.dataReloader.updateJobsMatchingFilter(
      jobIds,
      data.pageSize,
      data.currentPageNumber
    );

    this.dataReloader
      .fetchBuildsForJobs(this.dataReloader.newJobIds())
      .then(() => {});
  }
}
