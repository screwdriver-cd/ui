import Component from '@glimmer/component';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';

export default class PipelineModalToggleJobComponent extends Component {
  @service('shuttle') shuttle;

  @service('pipeline-page-state') pipelinePageState;

  @tracked isDisabled = false;

  @tracked stateChangeMessage = '';

  @tracked errorMessage = null;

  @tracked successMessage = null;

  @tracked jobs;

  toggleAction;

  constructor() {
    super(...arguments);

    this.jobs = this.args.jobs;
    this.toggleAction = this.args.toggleAction;
  }

  get modalTitle() {
    const jobText = this.jobs.length === 1 ? 'job' : 'jobs';

    return `${this.toggleAction} ${this.jobs.length} ${jobText}?`;
  }

  get jobNames() {
    return this.jobs
      .map(job => job.name)
      .sort()
      .join(', ');
  }

  get pendingActionText() {
    return this.toggleAction === 'Disable' ? 'Disabling' : 'Enabling';
  }

  @action
  async updateJob() {
    this.isDisabled = true;

    const payload = {
      state: this.toggleAction === 'Disable' ? 'DISABLED' : 'ENABLED'
    };

    payload.stateChangeMessage = this.stateChangeMessage || ' ';

    return Promise.allSettled(
      this.jobs.map(job => {
        return this.shuttle.fetchFromApi('put', `/jobs/${job.id}`, payload);
      })
    ).then(results => {
      const successfulResults = [];
      const successfulJobIds = [];

      let failureMessage;

      results.forEach(result => {
        if (result.value) {
          successfulResults.push(result.value);
          successfulJobIds.push(result.value.id);
        } else if (!failureMessage) {
          failureMessage = result.reason.message;
        }
      });

      if (successfulResults.length > 0) {
        const updatedJobs = this.pipelinePageState
          .getJobs()
          .map(existingJob => {
            if (successfulJobIds.includes(existingJob.id)) {
              return successfulResults.find(
                result => result.id === existingJob.id
              );
            }

            return existingJob;
          });

        this.pipelinePageState.setJobs(updatedJobs);

        if (successfulResults.length === this.jobs.length) {
          this.errorMessage = null;

          this.args.closeModal(true);
        } else {
          this.errorMessage = `${failureMessage}\nRetry toggling the failed jobs again?`;

          const jobsToRetry = [];

          this.jobs.forEach(job => {
            if (!successfulResults.includes(job.id)) {
              jobsToRetry.push(job);
            }
          });
          this.jobs = jobsToRetry;
        }
      } else {
        this.errorMessage = `${results[0].reason.message}`;
        this.isDisabled = false;
      }
    });
  }
}
