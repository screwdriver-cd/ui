import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';

export default class TokensModalRefreshComponent extends Component {
  @service shuttle;

  @service pipelinePageState;

  @tracked errorMessage;

  @tracked isAwaitingResponse;

  @tracked wasActionSuccessful;

  @tracked isCopyButtonDisabled;

  @tracked tokenValue;

  token;

  constructor() {
    super(...arguments);

    this.isAwaitingResponse = false;
    this.wasActionSuccessful = false;
    this.isCopyButtonDisabled = false;

    this.token = this.args.token;
  }

  get tokenType() {
    return this.token.type;
  }

  get isSubmitButtonDisabled() {
    return !!(this.wasActionSuccessful || this.isAwaitingResponse);
  }

  get tokenValue() {
    return this.token?.value;
  }

  @action
  copyTokenValue() {
    navigator.clipboard.writeText(this.tokenValue).then(() => {
      this.isCopyButtonDisabled = true;
    });
  }

  @action
  async refreshToken() {
    this.isAwaitingResponse = true;

    const refreshUrl = `/tokens/${this.token.id}/refresh`;
    const url =
      this.token.type === 'pipeline'
        ? `/pipelines/${this.pipelinePageState.getPipelineId()}${refreshUrl}`
        : refreshUrl;

    return this.shuttle
      .fetchFromApi('put', url)
      .then(response => {
        this.tokenValue = response.value;
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
