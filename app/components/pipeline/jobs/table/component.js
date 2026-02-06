import Component from '@glimmer/component';
import { service } from '@ember/service';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { cancel, debounce } from '@ember/runloop';
import { dom } from '@fortawesome/fontawesome-svg-core';
import _ from 'lodash';
import { statuses } from 'screwdriver-ui/utils/build';
import { isComplete } from 'screwdriver-ui/utils/pipeline/event';
import {
  getDisplayName,
  getStageName
} from 'screwdriver-ui/utils/pipeline/job';
import { canJobStart } from 'screwdriver-ui/utils/pipeline-workflow';
import DataReloader from './dataReloader';
import sortJobs from './util';

const INITIAL_PAGE_SIZE = 10;

export default class PipelineJobsTableComponent extends Component {
  @service('shuttle') shuttle;

  @service('pipeline-page-state') pipelinePageState;

  @service('workflow-data-reload') workflowDataReload;

  @service('emt-themes/ember-bootstrap-v5') emberModelTableBootstrapTheme;

  pipelineId;

  event;

  dataReloader;

  jobs;

  view;

  previousBuilds;

  previousEventBuilds;

  @tracked data;

  columns;

  displayDataChangeDebounceTimer = null;

  debounceDelayMs = 500;

  constructor() {
    super(...arguments);

    this.pipelineId = this.args.pipelineId;
    this.event = this.args.event;
    this.data = null;
    this.view = this.pipelinePageState.getIsPr() ? 'pulls' : 'events';
    this.previousBuilds = new Map();
    if (this.event) {
      this.previousEventBuilds = [];
    }

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
        component: 'startTimeCell',
        propertyName: 'startTime',
        sortBy: 'startTime'
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

    if (this.displayDataChangeDebounceTimer) {
      cancel(this.displayDataChangeDebounceTimer);
      this.displayDataChangeDebounceTimer = null;
    }
  }

  initialize() {
    this.setJobs();

    this.dataReloader = new DataReloader(
      { shuttle: this.shuttle, workflowDataReload: this.workflowDataReload },
      Array.from(this.jobs.keys()),
      INITIAL_PAGE_SIZE,
      this.args.event ? 1 : null,
      this.setData
    );

    if (!this.event) {
      this.dataReloader.fetchBuildsForJobs().then(() => {});
    }

    this.dataReloader.start(this.event?.id);
  }

  setJobs() {
    this.jobs = new Map();

    const jobs =
      this.view === 'pulls'
        ? this.workflowDataReload.getJobsForPr(this.event.prNum)
        : this.pipelinePageState.getJobs();
    const workflowGraph =
      this.view === 'pulls'
        ? this.event.workflowGraph
        : this.pipelinePageState.getPipeline().workflowGraph;

    jobs.forEach(job => {
      this.jobs.set(job.id, {
        job,
        canStartFromView: canJobStart(this.view, workflowGraph, job.name)
      });
    });
  }

  @action
  insert(element) {
    dom.i2svg({ node: element });

    this.initialize();
  }

  @action
  update(element, [pipelineId, event]) {
    this.data = [];

    this.dataReloader.stop(this.event.id);
    this.event = event;

    if (this.pipelineId !== pipelineId) {
      this.initialize();

      return;
    }

    if (this.view === 'pulls') {
      this.initialize();
    }

    this.dataReloader.start(this.event.id);
  }

  get theme() {
    const theme = this.emberModelTableBootstrapTheme;

    theme.table = 'table table-condensed table-hover table-sm';

    return theme;
  }

  @action
  onDisplayDataChanged(data) {
    this.displayDataChangeDebounceTimer = debounce(
      this,
      this._handleDisplayDataChange,
      data,
      this.debounceDelayMs
    );
  }

  _handleDisplayDataChange(data) {
    const jobIds = data.filteredContent.map(record => record.job.id);

    this.dataReloader.updateJobsMatchingFilter(
      jobIds,
      data.pageSize,
      data.currentPageNumber
    );

    if (!this.event) {
      this.dataReloader.fetchBuildsForJobs().then(() => {});
    }
  }

  @action
  setData(builds) {
    const data = [];

    let jobBuildsMap = new Map();

    if (this.event) {
      if (builds) {
        builds.forEach(build => {
          jobBuildsMap.set(build.jobId, [build]);
        });
      }

      if (isComplete(builds, this.previousEventBuilds)) {
        this.dataReloader.stop(this.event.id);
        this.previousEventBuilds = [];
      } else {
        this.previousEventBuilds = builds;
      }
    } else if (builds) {
      jobBuildsMap = builds;
    }

    let buildsHaveChanged = false;

    if (this.previousBuilds.size !== jobBuildsMap.size) {
      buildsHaveChanged = true;
    } else {
      const previousJobIds = Array.from(this.previousBuilds.keys());
      const currentJobIds = Array.from(jobBuildsMap.keys());
      const unchangedJobIds = _.intersection(previousJobIds, currentJobIds);

      if (unchangedJobIds.length !== previousJobIds.length) {
        buildsHaveChanged = true;
      } else {
        jobBuildsMap.forEach((buildsForJob, jobId) => {
          if (this.previousBuilds.get(jobId).length !== buildsForJob.length) {
            buildsHaveChanged = true;
          } else {
            const previousBuildForJob = _.last(this.previousBuilds.get(jobId));
            const latestBuildForJob = _.last(buildsForJob);

            if (
              previousBuildForJob?.id !== latestBuildForJob?.id ||
              previousBuildForJob?.status !== latestBuildForJob?.status
            ) {
              buildsHaveChanged = true;
            }
          }
        });
      }
    }

    if (buildsHaveChanged) {
      this.previousBuilds = jobBuildsMap;

      this.jobs.forEach(({ job, canStartFromView }) => {
        const buildsForJob = jobBuildsMap.get(job.id);

        data.push({
          job,
          canStartFromView,
          event: this.event,
          build: buildsForJob ? _.last(buildsForJob) : null,
          builds: buildsForJob,
          jobName: getDisplayName(job, this.event?.prNum),
          stageName: getStageName(job),
          startTime: buildsForJob ? _.last(buildsForJob)?.startTime : null
        });
      });

      this.data = this.event ? data.sort(sortJobs) : data;
    }
  }
}
