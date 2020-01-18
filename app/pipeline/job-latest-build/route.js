import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default Route.extend({
  latestBuildService: service('build-latest'),
  queryParams: {
    status: ''
  },
  model(params, transition) {
    const pipelineId = transition.params.pipeline.pipeline_id;
    const { job_name: jobName, status: buildStatus } = params;

    return this.latestBuildService.getLatestBuild(pipelineId, jobName, buildStatus);
  }
});
