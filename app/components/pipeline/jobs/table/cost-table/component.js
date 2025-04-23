import Component from '@glimmer/component';
import { service } from '@ember/service';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { dom } from '@fortawesome/fontawesome-svg-core';
import _ from 'lodash';
import { isComplete } from 'screwdriver-ui/utils/pipeline/event';
import DataReloader from '../dataReloader';
import { getDisplayName, sortJobs } from '../util';

const INITIAL_PAGE_SIZE = 10;

export default class PipelineJobsTableCostTableComponent extends Component {
  @service shuttle;

  @service pipelinePageState;

  @service workflowDataReload;

  @service('emt-themes/ember-bootstrap-v5') emberModelTableBootstrapTheme;

  event;

  dataReloader;

  jobs;

  previousBuilds;

  columns;

  @tracked data;

  constructor() {
    super(...arguments);

    this.event = this.args.event;
    this.data = null;
    this.previousBuilds = new Map();
    this.columns = [
      {
        title: 'JOB',
        propertyName: 'jobName',
        className: 'job-column',
        component: 'jobCell',
        filteredBy: 'jobName'
      },
      {
        title: 'CPU',
        className: 'cpu-column',
        propertyName: 'cpu'
      },
      {
        title: 'MEMORY',
        className: 'memory-column',
        propertyName: 'memory'
      },
      {
        title: 'COST',
        className: 'cost-column',
        propertyName: 'cost'
      }
    ];
    this.setJobs();

    this.dataReloader = new DataReloader(
      { shuttle: this.shuttle, workflowDataReload: this.workflowDataReload },
      Array.from(this.jobs.keys()),
      INITIAL_PAGE_SIZE,
      this.args.event ? 1 : null,
      this.setData
    );
  }

  get theme() {
    const theme = this.emberModelTableBootstrapTheme;

    theme.table = 'table table-condensed table-hover table-sm';

    return theme;
  }

  willDestroy() {
    super.willDestroy();

    this.dataReloader.stop(this.event?.id);
  }

  @action
  initialize(element) {
    dom.i2svg({ node: element });

    if (!this.event) {
      this.dataReloader.fetchBuildsForJobs().then(() => {});
    }

    this.dataReloader.start(this.event?.id);
  }

  setJobs() {
    this.jobs = new Map();

    const jobs = this.event?.prNum
      ? this.workflowDataReload.getJobsForPr(this.event.prNum)
      : this.pipelinePageState.getJobs();

    jobs.forEach(job => {
      this.jobs.set(job.id, job);
    });
  }

  @action
  update(element, [event]) {
    this.data = [];

    this.dataReloader.stop(this.event.id);
    this.event = event;
    this.dataReloader.start(this.event.id);
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
      this.dataReloader.fetchBuildsForJobs().then(() => {});
    }
  }

  @action
  setData(builds) {
    const data = [];

    let jobBuildsMap = new Map();

    if (this.event) {
      if (isComplete(builds)) {
        this.dataReloader.stop(this.event.id);
      }

      if (builds) {
        builds.forEach(build => {
          jobBuildsMap.set(build.jobId, [build]);
        });
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

      this.jobs.forEach(job => {
        const buildsForJob = jobBuildsMap.get(job.id);
        const build = buildsForJob ? _.last(buildsForJob) : null;
        const costMetrics = build?.meta?.build?.cost_metrics;
        const cpu = costMetrics?.cpu;
        const memory = costMetrics?.memory;
        const cost = costMetrics?.cost;

        data.push({
          job,
          build,
          jobName: getDisplayName(job, this.event?.prNum),
          cpu,
          memory,
          cost: cost ? String(`$${cost.toFixed(4)}`) : ''
        });
      });

      this.data = this.event ? data.sort(sortJobs) : data;
    }
  }
}
