import Route from '@ember/routing/route';
import { service } from '@ember/service';
import {
  getPrNumber,
  getPrNumbers,
  newestPrNumber
} from 'screwdriver-ui/utils/pipeline/pull-request';

export default class V2PipelinePullsShowRoute extends Route {
  @service shuttle;

  @service selectedPrSha;

  queryParams = {
    sha: {
      refreshModel: false
    }
  };

  async model(params) {
    const model = this.modelFor('v2.pipeline.pulls');
    const { pipeline, pullRequestJobs } = model;
    const pipelineId = pipeline.id;
    const prNums = getPrNumbers(pullRequestJobs);
    const prNum = parseInt(params.pull_request_number, 10);
    const { sha } = params;

    let latestEvent;

    let event;

    if (prNums.has(prNum)) {
      const baseUrl = `/pipelines/${pipelineId}/events?prNum=${prNum}`;
      const url = sha ? `${baseUrl}&sha=${sha}` : baseUrl;

      event = await this.shuttle.fetchFromApi('get', url).then(events => {
        return events[0];
      });
      latestEvent = event;
    } else {
      const newestPrNum = newestPrNumber(prNums);
      const baseUrl = `/pipelines/${pipelineId}/events?prNum=${newestPrNum}`;
      const url = sha ? `${baseUrl}&sha=${sha}` : baseUrl;

      latestEvent = await this.shuttle.fetchFromApi('get', url).then(events => {
        return events[0];
      });
    }

    let jobs = [];

    if (event && !pipeline.chainPR) {
      jobs = await this.shuttle.fetchFromApi(
        'get',
        `/pipelines/${pipelineId}/jobs?type=pipeline`
      );

      model.pullRequestJobs.forEach(prJob => {
        if (getPrNumber(prJob) === prNum) {
          jobs.push({ ...prJob, group: prNum });
        }
      });
    }

    this.selectedPrSha.setSha(event.sha);

    return {
      ...model,
      jobs,
      event,
      latestEvent,
      prNums: Array.from(prNums).sort((a, b) => a - b),
      invalidEvent: event === undefined
    };
  }
}