import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { expiresOptions } from 'screwdriver-ui/components/tokens/modal/token-options';

export default class TokensModalRefreshComponent extends Component {
  expiresOptions = expiresOptions;

  @service shuttle;

  @service pipelinePageState;

  @tracked errorMessage;

  @tracked isAwaitingResponse;

  @tracked wasActionSuccessful;

  @tracked isCopyButtonDisabled;

  @tracked tokenValue;

  @tracked tokenExpires;

  constructor() {
    super(...arguments);

    this.isAwaitingResponse = false;
    this.wasActionSuccessful = false;
    this.isCopyButtonDisabled = false;
  }

  get isSubmitButtonDisabled() {
    return !!(this.wasActionSuccessful || this.isAwaitingResponse);
  }

  @action
  setTokenExpires(option) {
    this.tokenExpires = option;
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

    const refreshUrl = `/tokens/${this.args.token.id}/refresh`;
    const url =
      this.args.token.type === 'pipeline'
        ? `/pipelines/${this.pipelinePageState.getPipelineId()}${refreshUrl}`
        : refreshUrl;

    const body = {};

    if (this.tokenExpires) {
      body.expiresAt = this.tokenExpires.getExpiresAt();
    }

    return this.shuttle
      .fetchFromApi('put', url, body)
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
