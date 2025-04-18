import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';

export default class PipelineSecretsAndTokensModalEditComponent extends Component {
  @service shuttle;

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

    return !this.secretValue && this.allowInPr === this.args.secret.allowInPr;
  }

  @action
  async editSecret() {
    this.isAwaitingResponse = true;

    return this.shuttle
      .fetchFromApi('PUT', `/secrets/${this.args.secret.id}`, {
        value: '',
        allowInPR: this.allowInPr
      })
      .then(() => {
        this.wasActionSuccessful = true;
        if (this.allowInPr !== this.args.secret.allowInPr) {
          this.args.closeModal(this.allowInPr);
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
