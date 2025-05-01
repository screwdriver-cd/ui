import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';

export default class PipelineSecretsAndTokensModalOverrideComponent extends Component {
  @service shuttle;

  @service pipelinePageState;

  @tracked errorMessage;

  @tracked isAwaitingResponse;

  @tracked wasActionSuccessful;

  @tracked secretValue;

  @tracked allowInPr;

  constructor() {
    super(...arguments);

    this.isAwaitingResponse = false;
    this.wasActionSuccessful = false;
    this.allowInPr = this.args.secret.allowInPr;
  }

  @action
  toggleAllowInPr() {
    this.allowInPr = !this.allowInPr;
  }

  get isSubmitButtonDisabled() {
    if (this.wasActionSuccessful || this.isAwaitingResponse) {
      return true;
    }

    return !this.secretValue;
  }

  @action
  async overrideSecret() {
    this.isAwaitingResponse = true;

    return this.shuttle
      .fetchFromApi('post', `/secrets/`, {
        pipelineId: this.pipelinePageState.getPipelineId(),
        name: this.args.secret.name,
        value: this.secretValue,
        allowInPR: this.allowInPr
      })
      .then(response => {
        this.wasActionSuccessful = true;
        this.args.closeModal(response);
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
