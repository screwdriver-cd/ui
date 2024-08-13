import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { buildPostBody, capitalizeFirstLetter, truncateMessage } from './util';

export default class PipelineModalConfirmActionComponent extends Component {
  @service shuttle;

  @service session;

  @tracked errorMessage = null;

  @tracked successMessage = null;

  @tracked isAwaitingResponse = false;

  @tracked wasActionSuccessful = false;

  @tracked reason = '';

  parameters;

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
    const pipelineParameters = this.args.pipeline.parameters || {};
    const eventParameters = this.args.event.meta?.parameters || {};

    return (
      Object.keys(pipelineParameters).length > 0 ||
      Object.keys(eventParameters).length > 0
    );
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
      .then(() => {
        this.successMessage = `${capitalizeFirstLetter(
          this.action
        )}ed successfully`;
        this.wasActionSuccessful = true;
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
