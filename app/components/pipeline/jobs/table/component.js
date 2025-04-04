import Component from '@glimmer/component';
import { service } from '@ember/service';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { dom } from '@fortawesome/fontawesome-svg-core';
import _ from 'lodash';
import { statuses } from 'screwdriver-ui/utils/build';
import DataReloader from './dataReloader';
import getDisplayName from './util';

const INITIAL_PAGE_SIZE = 10;

export default class PipelineJobsTableComponent extends Component {
  @service shuttle;

  @service pipelinePageState;

  @service workflowDataReload;

  @service('emt-themes/ember-bootstrap-v5') emberModelTableBootstrapTheme;

  userSettings;

  event;

  dataReloader;

  numBuilds;

  @tracked data;

  columns;

  constructor() {
    super(...arguments);

    this.event = this.args.event;
    this.userSettings = this.args.userSettings;
    this.numBuilds = this.args.numBuilds;
    this.data = null;

    this.setColumnData();
  }

  setColumnData() {
    let historyColumnConfiguration;

    if (this.event) {
      historyColumnConfiguration = {
        title: 'STATUS',
        className: 'status-column',
        component: 'statusCell',
        propertyName: 'status',
        filterWithSelect: true,
        predefinedFilterOptions: [...statuses, 'WARNING']
          // eslint-disable-next-line ember/no-string-prototype-extensions
          .map(status => _.capitalize(status))
          .sort(),
        filterFunction: (val, filterVal, row) => {
          const filterValue = filterVal.toLowerCase();

          if (val !== 'undefined') {
            return val.toLowerCase() === filterValue;
          }

          const build = this.workflowDataReload
            .getBuildsForEvent(this.event.id)
            .filter(b => b.jobId === row.job.id)[0];

          return build?.status.toLowerCase() === filterValue;
        }
      };
    } else {
      historyColumnConfiguration = {
        title: 'HISTORY',
        className: 'history-column',
        component: 'historyCell',
        propertyName: 'history',
        filterWithSelect: true,
        predefinedFilterOptions: ['5', '10', '15', '20', '25', '30'],
        filterFunction: async (_val, filterVal) => {
          await this.dataReloader.setNumBuilds(filterVal);
        }
      };
    }

    this.columns = [
      {
        title: 'JOB',
        propertyName: 'jobName',
        className: 'job-column',
        component: 'jobCell',
        filteredBy: 'jobName'
      },
      historyColumnConfiguration,
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
    const jobs = prNum
      ? this.workflowDataReload.getJobsForPr(prNum)
      : this.pipelinePageState.getJobs();

    const jobIds = jobs.map(job => job.id);

    this.dataReloader = new DataReloader(
      { shuttle: this.shuttle, workflowDataReload: this.workflowDataReload },
      jobIds,
      INITIAL_PAGE_SIZE,
      this.numBuilds
    );

    this.data = [];

    jobs.forEach(job => {
      this.data.push({
        job,
        jobName: getDisplayName(job, prNum),
        stageName: job?.permutations?.[0]?.stage?.name || 'N/A',
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

    if (!this.event) {
      this.dataReloader
        .fetchBuildsForJobs(this.dataReloader.newJobIds())
        .then(() => {});
    }
  }
}
