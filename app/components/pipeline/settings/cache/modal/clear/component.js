import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';

export default class PipelineSettingsCacheModalClearComponent extends Component {
  @service('shuttle') shuttle;

  @service('pipeline-page-state') pipelinePageState;

  @tracked errorMessage = null;

  @tracked isDisabled = false;

  @tracked jobs;

  jobIdsCleared = [];

  clearPipeline = false;

  constructor() {
    super(...arguments);

    this.clearPipeline = this.args.jobs === undefined;
    this.jobs = this.args.jobs ? Array.from(this.args.jobs) : [];
  }

  get modalTitle() {
    if (this.clearPipeline) {
      return 'Clear pipeline cache?';
    }

    if (this.jobs.length === 1) {
      return `Clear cache for ${this.jobs[0].name}?`;
    }

    return `Clear cache for ${this.jobs.length} jobs?`;
  }

  get clearCacheMessage() {
    if (this.clearPipeline) {
      return 'Are you sure you want to clear the pipeline cache?';
    }

    if (this.jobs.length === 1) {
      return `Are you sure you want to clear the cache for the job ${this.jobs[0].name}?`;
    }

    return 'Are you sure you want to clear the cache for the following jobs?';
  }

  get jobNames() {
    return this.jobs
      .map(job => job.name)
      .sort()
      .join(', ');
  }

  @action
  async clearCache() {
    this.isDisabled = true;
    const pipelineId = this.pipelinePageState.getPipelineId();

    if (this.clearPipeline) {
      return this.shuttle
        .fetchFromApi(
          'delete',
          `/pipelines/${pipelineId}/caches?scope=pipelines&cacheId=${pipelineId}`
        )
        .then(() => {
          this.args.closeModal(true);
        })
        .catch(err => {
          this.errorMessage = err.message;
          this.isDisabled = false;
        });
    }

    const jobIds = [];

    return Promise.allSettled(
      this.jobs.map(job => {
        jobIds.push(job.id);

        return this.shuttle.fetchFromApi(
          'delete',
          `/pipelines/${pipelineId}/caches?scope=jobs&cacheId=${job.id}`
        );
      })
    ).then(results => {
      let failureMessage;
      const jobsClearedOnRequest = [];

      results.forEach((result, i) => {
        if (result.status === 'fulfilled') {
          const jobId = jobIds[i];

          jobsClearedOnRequest.push(jobId);
          this.jobIdsCleared.push(jobId);
        } else if (!failureMessage) {
          failureMessage = result.reason.message;
        }
      });

      if (jobsClearedOnRequest.length > 0) {
        if (jobsClearedOnRequest.length === this.jobs.length) {
          this.errorMessage = null;

          this.args.closeModal(true, this.jobIdsCleared);
        } else {
          this.errorMessage = `${failureMessage}\nRetry clearing the failed jobs again?`;

          const jobsToRetry = [];

          this.jobs.forEach(job => {
            if (!this.jobIdsCleared.includes(job.id)) {
              jobsToRetry.push(job);
            }
          });
          this.jobs = jobsToRetry;
          this.isDisabled = false;
        }
      } else {
        this.errorMessage = `${results[0].reason.message}`;
        this.isDisabled = false;
      }
    });
  }

  @action
  closeModal() {
    if (this.clearPipeline) {
      return this.args.closeModal(false);
    }

    return this.args.closeModal(false, this.jobIdsCleared);
  }
}
