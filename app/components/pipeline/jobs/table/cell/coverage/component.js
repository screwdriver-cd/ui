import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';

export default class PipelineJobsTableCellCoverageComponent extends Component {
  @service shuttle;

  @service pipelinePageState;

  @tracked coverage;

  constructor() {
    super(...arguments);

    if (this.args.record.build) {
      const { job } = this.args.record;
      const pipeline = this.pipelinePageState.getPipeline();

      this.shuttle
        .fetchFromApi('get', '/coverage/info', {
          jobId: job.id,
          buildId: this.args.record.build.id,
          startTime: this.args.record.build.startTime,
          endTime: this.args.record.build.endTime,
          jobName: job.name,
          pipelineName: pipeline.name,
          projectKey: `pipeline:${pipeline.id}`
        })
        .then(response => {
          if (response.coverage) {
            this.coverage =
              response.coverage === 'N/A'
                ? response.coverage
                : `${response.coverage}%`;
          }
        })
        .catch(() => {
          this.coverage = null;
        });
    }
  }
}
