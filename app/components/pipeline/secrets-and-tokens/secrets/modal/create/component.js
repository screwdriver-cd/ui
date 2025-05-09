import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';

export default class PipelineSecretsAndTokensModalCreateComponent extends Component {
  @service('shuttle') shuttle;

  @service('pipeline-page-state') pipelinePageState;

  @service('pipeline-secrets') pipelineSecrets;

  @tracked errorMessage;

  @tracked isAwaitingResponse;

  @tracked wasActionSuccessful;

  @tracked secretName;

  @tracked secretValue;

  @tracked allowInPr;

  constructor() {
    super(...arguments);

    this.isAwaitingResponse = false;
    this.wasActionSuccessful = false;
    this.allowInPr = false;
  }

  isSecretNameInvalid() {
    const secretNameRegex = /^[A-Z][A-Z_]*$/;

    return this.secretName
      ? this.pipelineSecrets.secretNames.includes(this.secretName) ||
          secretNameRegex.test(this.secretName) === false
      : false;
  }

  get secretNameClass() {
    return this.isSecretNameInvalid() ? 'invalid' : null;
  }

  get isSubmitButtonDisabled() {
    if (this.wasActionSuccessful || this.isAwaitingResponse) {
      return true;
    }

    return !this.secretName || !this.secretValue || this.isSecretNameInvalid();
  }

  @action
  toggleAllowInPr() {
    this.allowInPr = !this.allowInPr;
  }

  @action
  async createSecret() {
    this.isAwaitingResponse = true;

    return this.shuttle
      .fetchFromApi('post', '/secrets', {
        pipelineId: this.pipelinePageState.getPipelineId(),
        name: this.secretName,
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
