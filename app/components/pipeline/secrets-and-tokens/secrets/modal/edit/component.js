import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';

export default class PipelineSecretsAndTokensModalEditComponent extends Component {
  @service('shuttle') shuttle;

  @service('pipeline-page-state') pipelinePageState;

  @tracked errorMessage;

  @tracked isAwaitingResponse;

  @tracked wasActionSuccessful;

  @tracked secretValue;

  @tracked allowInPr;

  isOverride;

  constructor() {
    super(...arguments);

    this.isAwaitingResponse = false;
    this.wasActionSuccessful = false;

    const { secret } = this.args;

    this.allowInPr = secret.allowInPr;
    this.isOverride = secret.inherited && !secret.overridden;
  }

  get headerText() {
    const { name } = this.args.secret;

    if (this.isOverride) {
      return `Override inherited secret: ${name}`;
    }

    return `Edit secret ${name}`;
  }

  get submitButtonDefaultText() {
    const editAction = this.isOverride ? 'Override' : 'Update';

    return `${editAction} secret`;
  }

  get submitButtonPendingText() {
    const editAction = this.isOverride ? 'Overriding' : 'Updating';

    return `${editAction} secret...`;
  }

  @action
  toggleAllowInPr() {
    this.allowInPr = !this.allowInPr;
  }

  get isSubmitButtonDisabled() {
    if (this.wasActionSuccessful || this.isAwaitingResponse) {
      return true;
    }

    if (this.isOverride) {
      return !this.secretValue;
    }

    return !this.secretValue && this.allowInPr === this.args.secret.allowInPr;
  }

  @action
  async editSecret() {
    this.isAwaitingResponse = true;

    let method;

    let url;

    const payload = {
      value: this.secretValue,
      allowInPR: this.allowInPr
    };

    if (this.isOverride) {
      method = 'post';
      url = '/secrets';
      payload.pipelineId = this.pipelinePageState.getPipelineId();
      payload.name = this.args.secret.name;
    } else {
      method = 'put';
      url = `/secrets/${this.args.secret.id}`;
    }

    return this.shuttle
      .fetchFromApi(method, url, payload)
      .then(response => {
        this.wasActionSuccessful = true;

        if (this.isOverride) {
          this.args.closeModal(response);
        } else if (this.allowInPr !== this.args.secret.allowInPr) {
          this.args.closeModal(response);
        } else {
          this.args.closeModal();
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
