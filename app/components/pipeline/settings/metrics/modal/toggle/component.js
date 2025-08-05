import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';
import getJobIdsForPayload from './util';

export default class PipelineSettingsMetricsModalToggleComponent extends Component {
  @service('shuttle') shuttle;

  @service('pipeline-page-state') pipelinePageState;

  @tracked errorMessage = null;

  @tracked isDisabled = false;

  jobs;

  isInclude;

  constructor() {
    super(...arguments);

    this.jobs = this.args.jobs;
    this.isInclude = this.args.isInclude;
  }

  get modalTitle() {
    const toggleAction = this.isInclude ? 'Include' : 'Exclude';

    if (this.jobs.length === 1) {
      return `${toggleAction} ${this.jobs[0].name}?`;
    }

    return `${toggleAction} ${this.jobs.length} jobs?`;
  }

  get toggleJobsMessage() {
    const toggleAction = this.isInclude ? 'include' : 'exclude';

    if (this.jobs.length === 1) {
      return `Are you sure you want to ${toggleAction} this job in your downtime metrics?`;
    }

    return `Are you sure you want to ${toggleAction} the following jobs in your downtime metrics?`;
  }

  get jobNames() {
    return this.jobs
      .map(job => job.name)
      .sort()
      .join(', ');
  }

  get toggleAction() {
    return this.isInclude ? 'Include' : 'Exclude';
  }

  get pendingActionText() {
    return this.isInclude ? 'Including' : 'Excluding';
  }

  @action
  async toggleJobs() {
    this.isDisabled = true;

    const jobIdsPayload = getJobIdsForPayload(
      this.pipelinePageState.getPipeline(),
      this.jobs,
      this.isInclude
    );

    const payload = {
      settings: {
        metricsDowntimeJobs: jobIdsPayload
      }
    };

    return this.shuttle
      .fetchFromApi(
        'put',
        `/pipelines/${this.pipelinePageState.getPipelineId()}`,
        payload
      )
      .then(response => {
        this.pipelinePageState.setPipeline(response);
        this.args.closeModal(true);
      })
      .catch(err => {
        this.isDisabled = false;
        this.errorMessage = err.message;
      });
  }
}
