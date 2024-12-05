import Component from '@glimmer/component';
import { service } from '@ember/service';
import { action } from '@ember/object';
import DataReloader from './dataReloader';

const INITIAL_PAGE_SIZE = 10;

export default class PipelineJobsTableComponent extends Component {
  @service shuttle;

  @service('emt-themes/ember-bootstrap-v5') emberModelTableBootstrapTheme;

  dataReloader;

  data = [];

  columns = [
    {
      title: 'JOB',
      propertyName: 'jobName',
      className: 'job-column',
      component: 'jobCell'
    },
    {
      title: 'HISTORY',
      className: 'history-column',
      component: 'historyCell'
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
      component: 'stageCell'
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

    const jobIds = this.args.jobs.map(job => job.id);

    this.dataReloader = new DataReloader(
      this.shuttle,
      jobIds,
      INITIAL_PAGE_SIZE,
      this.args.numBuilds
    );
    const initialJobIds = this.dataReloader.newJobIds();

    this.args.jobs.forEach(job => {
      this.data.push({
        job,
        jobName: job.name,
        stageName: job?.permutations?.[0]?.stage?.name || 'N/A',
        pipeline: this.args.pipeline,
        jobs: this.args.jobs,
        timestampFormat: this.args.userSettings.timestampFormat,
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

    this.dataReloader.fetchBuildsForJobs(initialJobIds).then(() => {
      this.dataReloader.start();
    });
  }

  willDestroy() {
    super.willDestroy();

    this.dataReloader.destroy();
  }

  get theme() {
    const theme = this.emberModelTableBootstrapTheme;

    theme.searchPlaceholderMsg = 'Search for job by name';
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
