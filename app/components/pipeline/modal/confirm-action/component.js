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

  @service shuttle;

  @service workflowDataReload;

  @service session;

  @tracked errorMessage = null;

  @tracked isAwaitingResponse = false;

  @tracked wasActionSuccessful = false;

  @tracked reason = '';

  parameters;

  latestCommitEvent;

  constructor() {
    super(...arguments);

    this.latestCommitEvent = this.workflowDataReload.getLatestCommitEvent();
  }

  get action() {
    return this.args.job.status ? 'restart' : 'start';
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
    return this.args.event.type === 'pr' ? true : this.isLatestCommitEvent;
  }

  get isFrozen() {
    return this.args.job.status === 'FROZEN';
  }

  get isParameterized() {
    return isParameterized(this.args.pipeline, this.args.event);
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

  get completedAction() {
    return this.wasActionSuccessful
      ? `${capitalizeFirstLetter(this.action)}ed`
      : 'Yes';
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
      this.args.pipeline.id,
      this.args.job,
      this.args.event,
      this.parameters,
      this.isFrozen,
      this.reason
    );

    await this.shuttle
      .fetchFromApi('post', '/events', data)
      .then(event => {
        this.args.closeModal();

        if (this.router.currentRouteName === 'v2.pipeline.events.show') {
          this.router.transitionTo('v2.pipeline.events.show', {
            event,
            reloadEventRail: true,
            id: event.id
          });
        } else if (this.router.currentRouteName === 'v2.pipeline.pulls.show') {
          this.router.transitionTo('v2.pipeline.pulls.show', {
            event,
            reloadEventRail: true,
            id: event.prNum,
            pull_request_number: event.prNum,
            sha: event.sha
          });
        }
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
