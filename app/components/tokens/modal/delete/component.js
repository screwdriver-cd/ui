import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';

export default class TokensModalDeleteComponent extends Component {
  @service shuttle;

  @service pipelinePageState;

  @tracked errorMessage;

  @tracked isAwaitingResponse;

  @tracked wasActionSuccessful;

  @tracked tokenName;

  constructor() {
    super(...arguments);

    this.isAwaitingResponse = false;
    this.wasActionSuccessful = false;
  }

  get isSubmitButtonDisabled() {
    if (this.wasActionSuccessful || this.isAwaitingResponse) {
      return true;
    }

    return this.tokenName !== this.args.token.name;
  }

  @action
  async deleteToken() {
    this.isAwaitingResponse = true;

    const deleteUrl = `/tokens/${this.args.token.id}`;
    const url =
      this.args.token.type === 'pipeline'
        ? `/pipelines/${this.pipelinePageState.getPipelineId()}${deleteUrl}`
        : deleteUrl;

    return this.shuttle
      .fetchFromApi('delete', url)
      .then(() => {
        this.wasActionSuccessful = true;
        this.args.closeModal(this.args.token);
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
