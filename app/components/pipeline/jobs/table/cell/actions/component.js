import { action } from '@ember/object';
import { service } from '@ember/service';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { isInactivePipeline } from 'screwdriver-ui/utils/pipeline';
import { isStartButtonDisabled, isStopButtonDisabled } from './util';

export default class PipelineJobsTableCellActionsComponent extends Component {
  @service shuttle;

  @service('pipeline-page-state') pipelinePageState;

  @tracked showConfirmActionModal = false;

  @tracked showStopBuildModal = false;

  pipeline;

  isPipelineInactive = true;

  @tracked confirmAction;

  @tracked event = null;

  @tracked latestCommitEvent = null;

  constructor() {
    super(...arguments);

    this.pipeline = this.pipelinePageState.getPipeline();
    this.isPipelineInactive = isInactivePipeline(this.pipeline);
  }

  get startEventTitle() {
    return `Start a new event from ${this.args.record.job.name}`;
  }

  get startButtonDisabled() {
    return isStartButtonDisabled(
      this.isPipelineInactive,
      this.args.record.canStartFromView,
      this.args.record.job
    );
  }

  get stopButtonDisabled() {
    return isStopButtonDisabled(this.args.record.build);
  }

  async fetchLatestCommitEvent() {
    return this.shuttle.getLatestCommitEvent(this.pipeline.id);
  }

  async fetchRestartEvent() {
    const { build } = this.args.record;

    const eventId = build.meta.build
      ? build.meta.build.eventId
      : await this.shuttle
          .fetchFromApi('get', `/builds/${build.id}`)
          .then(response => {
            return response.eventId;
          });

    return this.shuttle.fetchFromApi('get', `/events/${eventId}`);
  }

  @action
  async openConfirmActionModal(actionType) {
    this.confirmAction = actionType;
    this.event = this.args.record.event || null;
    this.latestCommitEvent = null;

    // Jobs view start actions use the latest commit,
    // so only restart needs to resolve an event from the current build.
    if (!this.event && actionType === 'restart') {
      const [event, latestCommitEvent] = await Promise.all([
        this.fetchRestartEvent(),
        this.fetchLatestCommitEvent()
      ]);

      this.event = event;
      this.latestCommitEvent = latestCommitEvent;
    }

    this.showConfirmActionModal = true;
  }

  @action
  closeConfirmActionModal() {
    this.showConfirmActionModal = false;
    this.event = null;
    this.latestCommitEvent = null;
  }

  @action
  openStopBuildModal() {
    this.showStopBuildModal = true;
  }

  @action
  closeStopBuildModal() {
    this.showStopBuildModal = false;
  }
}
