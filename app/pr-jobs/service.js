import Service, { service } from '@ember/service';
import { getPrNumber } from 'screwdriver-ui/utils/pipeline/pull-request';

export default class PrJobsService extends Service {
  @service('shuttle') shuttle;

  @service('pipeline-page-state') pipelinePageState;

  pullRequestJobs = [];

  pipelineJobs = [];

  async setPullRequestJobs() {
    const pipelineId = this.pipelinePageState.getPipelineId();

    this.pullRequestJobs = await this.shuttle.fetchFromApi(
      'get',
      `/pipelines/${pipelineId}/jobs?type=pr`
    );
  }

  getPullRequestJobs() {
    return this.pullRequestJobs;
  }

  async setPipelineJobs() {
    const pipelineId = this.pipelinePageState.getPipelineId();

    this.pipelineJobs = await this.shuttle.fetchFromApi(
      'get',
      `/pipelines/${pipelineId}/jobs?type=pipeline`
    );
  }

  setPipelinePageStateJobs(event) {
    let jobs = [];

    if (event) {
      const { prNum } = event;

      jobs = [...this.pipelineJobs];

      this.pullRequestJobs.forEach(prJob => {
        if (getPrNumber(prJob) === prNum) {
          jobs.push({ ...prJob, group: prNum });
        }
      });
    }

    this.pipelinePageState.setJobs(jobs);
  }
}
