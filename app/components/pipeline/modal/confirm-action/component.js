import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { buildPostBody } from 'screwdriver-ui/utils/pipeline/modal/request';
import {
  capitalizeFirstLetter,
  isParameterized,
  truncateMessage
} from './util';

export default class PipelineModalConfirmActionComponent extends Component {
  @service router;

  @service session;

  @service('shuttle') shuttle;

  @service('pipeline-page-state') pipelinePageState;

  @service('workflow-data-reload') workflowDataReload;

  @tracked errorMessage = null;

  @tracked isAwaitingResponse = false;

  @tracked wasActionSuccessful = false;

  @tracked reason = '';

  pipeline;

  parameters;

  latestCommitEvent;

  /**
   * @type {string} Possible values 'start', 'restart'.
   *                'start' indicates that a new event should be started without inheriting the context from the current event.
   *                'restart' indicates that a new event should be started with inheriting the context from the current event.
   */
  action;

  constructor() {
    super(...arguments);

    this.action = this.args.newEventMode;

    this.pipeline = this.pipelinePageState.getPipeline();
    this.latestCommitEvent = this.workflowDataReload.getLatestCommitEvent();
  }

  get truncatedMessage() {
    return truncateMessage(this.args.event.commit.message);
  }

  get isLatestCommitEvent() {
    return this.args.event.sha === this.latestCommitEvent?.sha;
  }

  get commitUrl() {
    return this.args.event.commit.url;
  }

  get truncatedSha() {
    return this.args.event.sha.substring(0, 7);
  }

  get isLatestNonPrCommitEvent() {
    return this.pipelinePageState.getIsPr() ? true : this.isLatestCommitEvent;
  }

  get isFrozen() {
    return this.args.job.status === 'FROZEN';
  }

  get isParameterized() {
    return isParameterized(this.pipeline, this.args.event);
  }

  get isSubmitButtonDisabled() {
    if (this.wasActionSuccessful || this.isAwaitingResponse) {
      return true;
    }

    if (this.isFrozen) {
      return this.reason.length === 0;
    }

    return false;
  }

  get pendingAction() {
    return `${capitalizeFirstLetter(this.action)}ing...`;
  }

  @action
  onUpdateParameters(parameters) {
    this.parameters = parameters;
  }

  @action
  async startBuild() {
    this.isAwaitingResponse = true;

    const data = buildPostBody(
      this.session.data.authenticated.username,
      this.pipeline.id,
      this.args.job,
      this.action === 'restart' ? this.args.event : null,
      this.parameters,
      this.isFrozen,
      this.reason
    );

    await this.shuttle
      .fetchFromApi('post', '/events', data)
      .then(event => {
        this.args.closeModal();

        const route = this.pipelinePageState.getIsPr()
          ? 'v2.pipeline.pulls.show'
          : 'v2.pipeline.events.show';

        this.router.transitionTo(route, {
          event,
          reloadEventRail: true,
          id: event.id
        });
      })
      .catch(err => {
        this.wasActionSuccessful = false;
        this.errorMessage = err.message;
      })
      .finally(() => {
        this.isAwaitingResponse = false;
      });
  }
}
