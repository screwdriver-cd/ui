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

  confirmAction;

  event;

  latestCommitEvent;

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

  @action
  async openConfirmActionModal(actionType) {
    this.confirmAction = actionType;
    this.event = this.args.record.event;

    if (!this.event) {
      const latestCommitEventPromise = this.shuttle.fetchFromApi(
        'get',
        `/pipelines/${this.pipeline.id}/latestCommitEvent`
      );

      if (actionType === 'start') {
        Promise.all([
          this.shuttle.fetchFromApi(
            'get',
            `/pipelines/${this.pipeline.id}/events?count=1&type=pipeline`
          ),
          latestCommitEventPromise
        ]).then(([events, latestCommitEvent]) => {
          this.event = events[0];
          this.latestCommitEvent = latestCommitEvent;
          this.showConfirmActionModal = true;
        });
      } else {
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
          latestCommitEventPromise
        ]).then(([latestEvent, latestCommitEvent]) => {
          this.event = latestEvent;
          this.latestCommitEvent = latestCommitEvent;
          this.showConfirmActionModal = true;
        });
      }
    }
  }

  @action
  closeConfirmActionModal() {
    this.showConfirmActionModal = false;
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
