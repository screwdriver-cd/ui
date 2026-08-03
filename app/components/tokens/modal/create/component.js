import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';

export default class TokensModalCreateComponent extends Component {
  @service shuttle;

  @service pipelinePageState;

  @service('tokens') tokensService;

  @tracked errorMessage;

  @tracked tokenName;

  @tracked tokenDescription;

  @tracked tokenExpires = '1day';

  @tracked tokenPermission = 'read';

  @tracked isAwaitingResponse;

  @tracked wasActionSuccessful;

  @tracked isCopyButtonDisabled;

  @tracked newToken;

  expiresList = {
    '1day': date => date.setDate(date.getDate() + 1),
    '30days': date => date.setDate(date.getDate() + 30),
    '90days': date => date.setDate(date.getDate() + 90),
    '1year': date => date.setFullYear(date.getFullYear() + 1),
    'No expiration': () => null
  };

  expiresOptions = Object.keys(this.expiresList);

  tokenPremissionOptions = ['read', 'execute', 'write', 'all'];

  constructor() {
    super(...arguments);

    this.isAwaitingResponse = false;
    this.wasActionSuccessful = false;
    this.isCopyButtonDisabled = false;
  }

  isTokenNameInvalid() {
    return this.tokensService.tokenNames.includes(this.tokenName);
  }

  calculateExpiresAt() {
    if (this.tokenExpires === 'No expiration') {
      return '';
    }

    const date = new Date();

    this.expiresList[this.tokenExpires](date);

    return date.toISOString();
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
  setTokenExpires(tokenExpires) {
    this.tokenExpires = tokenExpires;
  }

  @action
  setTokenPermission(tokenPermission) {
    this.tokenPermission = tokenPermission;
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
        description: this.tokenDescription,
        expiresAt: this.calculateExpiresAt(),
        options: {
          permission: this.tokenPermission
        }
      })
      .then(response => {
        this.newToken = response;
        this.tokensService.addToken(response);
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
