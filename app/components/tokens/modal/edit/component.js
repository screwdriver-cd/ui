import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';

export default class TokensModalEditComponent extends Component {
  @service shuttle;

  @service('tokens') tokensService;

  @service pipelinePageState;

  @tracked errorMessage;

  @tracked tokenName;

  @tracked tokenDescription;

  @tracked isAwaitingResponse;

  @tracked wasActionSuccessful;

  constructor() {
    super(...arguments);

    this.isAwaitingResponse = false;
    this.wasActionSuccessful = false;
  }

  isTokenNameInvalid() {
    return this.tokensService.tokenNames.includes(this.tokenName);
  }

  get inputClass() {
    return this.isTokenNameInvalid() ? 'invalid' : null;
  }

  get isSubmitButtonDisabled() {
    if (this.wasActionSuccessful || this.isAwaitingResponse) {
      return true;
    }

    return (
      this.isTokenNameInvalid() || (!this.tokenName && !this.tokenDescription)
    );
  }

  @action
  async editToken() {
    this.isAwaitingResponse = true;

    const updateUrl = `/tokens/${this.args.token.id}`;
    const pipelineId = this.pipelinePageState.getPipelineId();
    const url = pipelineId ? `/pipelines/${pipelineId}${updateUrl}` : updateUrl;

    return this.shuttle
      .fetchFromApi('put', url, {
        name: this.tokenName,
        description: this.tokenDescription
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
