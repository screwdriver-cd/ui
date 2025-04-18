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
