import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';

export default class PipelineSecretsAndTokensModalDeleteComponent extends Component {
  @service shuttle;

  @tracked errorMessage;

  @tracked isAwaitingResponse;

  @tracked wasActionSuccessful;

  @tracked secretName;

  constructor() {
    super(...arguments);

    this.isAwaitingResponse = false;
    this.wasActionSuccessful = false;
  }

  get isSubmitButtonDisabled() {
    if (this.wasActionSuccessful || this.isAwaitingResponse) {
      return true;
    }

    return this.secretName !== this.args.secret.name;
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
