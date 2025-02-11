import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';

export default class PipelineJobsTableCellCoverageComponent extends Component {
  @service shuttle;

  @service pipelinePageState;

  @tracked latestBuild;

  @tracked coverage;

  constructor() {
    super(...arguments);

    const { job } = this.args.record;
    const pipeline = this.pipelinePageState.getPipeline();

    this.args.record.onCreate(job, builds => {
      if (builds.length > 0) {
        this.latestBuild = builds[builds.length - 1];

        this.shuttle
          .fetchFromApi('get', '/coverage/info', {
            jobId: job.id,
            buildId: this.latestBuild.id,
            startTime: this.latestBuild.startTime,
            endTime: this.latestBuild.endTime,
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
    });
  }

  willDestroy() {
    super.willDestroy();

    this.args.record.onDestroy(this.args.record.job);
  }
}
