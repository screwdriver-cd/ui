import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';

export default class TokensModalCreateComponent extends Component {
  @service shuttle;

  @service pipelinePageState;

  @tracked errorMessage;

  @tracked tokenName;

  @tracked tokenDescription;

  @tracked isAwaitingResponse;

  @tracked wasActionSuccessful;

  @tracked isCopyButtonDisabled;

  @tracked newToken;

  tokenNames;

  constructor() {
    super(...arguments);

    this.isAwaitingResponse = false;
    this.wasActionSuccessful = false;
    this.isCopyButtonDisabled = false;
    this.tokenNames = this.args.tokens.map(token => token.name);
  }

  isTokenNameInvalid() {
    return this.tokenNames.includes(this.tokenName);
  }

  get inputClass() {
    return this.isTokenNameInvalid() ? 'invalid' : null;
  }

  get isSubmitButtonDisabled() {
    if (this.wasActionSuccessful || this.isAwaitingResponse) {
      return true;
    }

    return !this.tokenName || this.isTokenNameInvalid();
  }

  get inputDisabled() {
    return !!this.tokenValue;
  }

  get tokenValue() {
    return this.newToken?.value;
  }

  @action
  copyTokenValue() {
    navigator.clipboard.writeText(this.tokenValue).then(() => {
      this.isCopyButtonDisabled = true;
    });
  }

  @action
  async createToken() {
    this.isAwaitingResponse = true;

    const url =
      this.args.type === 'pipeline'
        ? `/pipelines/${this.pipelinePageState.getPipelineId()}/tokens`
        : '/tokens';

    return this.shuttle
      .fetchFromApi('post', url, {
        name: this.tokenName,
        description: this.tokenDescription
      })
      .then(response => {
        this.newToken = response;
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
