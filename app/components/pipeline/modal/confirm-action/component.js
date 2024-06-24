import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';
import {
  buildPostBody,
  capitalizeFirstLetter,
  initializeParameters,
  truncateMessage
} from './util';

export default class PipelineModalConfirmActionComponent extends Component {
  @service shuttle;

  @service session;

  @tracked isAwaitingResponse = false;

  @tracked wasActionSuccessful = false;

  @tracked reason = '';

  parameters;

  constructor() {
    super(...arguments);

    this.parameters = initializeParameters(this.args.event);
  }

  get action() {
    return this.args.job.status ? 'restart' : 'start';
  }

  get truncatedMessage() {
    return truncateMessage(this.args.event.commit.message);
  }

  get isLatestCommitEvent() {
    return this.args.event.sha === this.args.latestCommitEvent.sha;
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
    if (this.args.pipeline.parameters) {
      return Object.keys(this.args.pipeline.parameters).length > 0;
    }

    return false;
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

    return new Promise((resolve, reject) => {
      this.shuttle
        .fetchFromApi('POST', '/events', data)
        .then(() => {
          this.wasActionSuccessful = true;
          resolve();
        })
        .catch(err => {
          this.wasActionSuccessful = false;
          reject(err);
        })
        .finally(() => {
          this.isAwaitingResponse = false;
        });
    });
  }
}
