import { action } from '@ember/object';
import { service } from '@ember/service';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { isInactivePipeline } from 'screwdriver-ui/utils/pipeline';
import {
  isRestartButtonDisabled,
  isStartButtonDisabled,
  isStopButtonDisabled,
  shouldDisplayNotice
} from './util';

export default class PipelineJobsTableCellActionsComponent extends Component {
  @service shuttle;

  @service pipelinePageState;

  @tracked showStartEventModal = false;

  @tracked showStopBuildModal = false;

  @tracked showRestartJobModal = false;

  pipeline;

  isPipelineInactive = true;

  latestEvent;

  latestCommitEvent;

  constructor() {
    super(...arguments);

    this.pipeline = this.pipelinePageState.getPipeline();
    this.isPipelineInactive = isInactivePipeline(this.pipeline);
  }

  get notice() {
    const { job } = this.args.record;

    return shouldDisplayNotice(this.pipeline, job)
      ? `This will create a new event then trigger downstream jobs. Make sure the (${job.name}) job can be successfully completed without rerunning any upstream jobs (i.e., does this job depend on any metadata that was previously set?)`
      : null;
  }

  get startEventTitle() {
    return `Start a new event from ${this.args.record.job.name}`;
  }

  get startButtonDisabled() {
    return isStartButtonDisabled(this.isPipelineInactive, this.args.record.job);
  }

  get stopButtonDisabled() {
    return isStopButtonDisabled(this.args.record.build);
  }

  get restartButtonDisabled() {
    return isRestartButtonDisabled(
      this.isPipelineInactive,
      this.args.record.job,
      this.args.record.build
    );
  }

  @action
  openStartEventModal() {
    this.showStartEventModal = true;
  }

  @action
  closeStartEventModal() {
    this.showStartEventModal = false;
  }

  @action
  openStopBuildModal() {
    this.showStopBuildModal = true;
  }

  @action
  closeStopBuildModal() {
    this.showStopBuildModal = false;
  }

  @action
  async openRestartJobModal() {
    const { build } = this.args.record;
    const eventId = build.meta.build
      ? build.meta.build.eventId
      : await this.shuttle
          .fetchFromApi('get', `/builds/${build.id}`)
          .then(response => {
            return response.eventId;
          });

    Promise.all([
      this.shuttle.fetchFromApi('get', `/events/${eventId}`),
      this.shuttle.fetchFromApi(
        'get',
        `/pipelines/${this.pipeline.id}/latestCommitEvent`
      )
    ]).then(([latestEvent, latestCommitEvent]) => {
      this.latestEvent = latestEvent;
      this.latestCommitEvent = latestCommitEvent;
      this.showRestartJobModal = true;
    });
  }

  @action
  closeRestartJobModal() {
    this.showRestartJobModal = false;
  }
}
