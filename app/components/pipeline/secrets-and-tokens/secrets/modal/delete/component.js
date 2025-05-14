import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';

export default class PipelineSecretsAndTokensModalDeleteComponent extends Component {
  @service('shuttle') shuttle;

  @tracked errorMessage;

  @tracked isAwaitingResponse;

  @tracked wasActionSuccessful;

  @tracked secretName;

  constructor() {
    super(...arguments);

    this.isAwaitingResponse = false;
    this.wasActionSuccessful = false;
  }

  isSecretOverridden() {
    return this.args.secret.overridden;
  }

  getSecretName() {
    return this.args.secret.name;
  }

  get modalHeader() {
    return this.isSecretOverridden()
      ? `Revert overridden secret value for ${this.getSecretName()}`
      : `Delete secret ${this.getSecretName()}`;
  }

  get isSubmitButtonDisabled() {
    if (this.wasActionSuccessful || this.isAwaitingResponse) {
      return true;
    }

    return this.secretName !== this.getSecretName();
  }

  get deleteSecretNote() {
    return this.isSecretOverridden()
      ? `Reverts the secret value to the inherited value`
      : 'Deleting this secret is permanent!';
  }

  get buttonDefaultText() {
    return this.isSecretOverridden() ? 'Revert secret' : 'Delete secret';
  }

  get buttonPendingText() {
    return this.isSecretOverridden()
      ? 'Reverting secret...'
      : 'Deleting secret...';
  }

  @action
  async deleteSecret() {
    this.isAwaitingResponse = true;

    return this.shuttle
      .fetchFromApi('delete', `/secrets/${this.args.secret.id}`)
      .then(() => {
        this.wasActionSuccessful = true;
        this.args.closeModal(this.args.secret);
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
