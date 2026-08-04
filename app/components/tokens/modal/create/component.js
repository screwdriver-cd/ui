import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';

export default class TokensModalCreateComponent extends Component {
  expiresOptions = [
    {
      label: '1 day',
      getExpiresAt: () => {
        const now = new Date();

        now.setDate(now.getDate() + 1);

        return now.toISOString();
      }
    },
    {
      label: '30 days',
      getExpiresAt: () => {
        const now = new Date();

        now.setDate(now.getDate() + 30);

        return now.toISOString();
      }
    },
    {
      label: '90 days',
      getExpiresAt: () => {
        const now = new Date();

        now.setDate(now.getDate() + 90);

        return now.toISOString();
      }
    },
    {
      label: '1 year',
      getExpiresAt: () => {
        const now = new Date();

        now.setFullYear(now.getFullYear() + 1);

        return now.toISOString();
      }
    },
    {
      label: 'No expiration',
      getExpiresAt: () => ''
    }
  ];

  tokenPermissionOptions = ['read', 'execute', 'write', 'all'];

  @service shuttle;

  @service pipelinePageState;

  @service('tokens') tokensService;

  @tracked errorMessage;

  @tracked tokenName;

  @tracked tokenDescription;

  // Initial value should be '1 day'
  @tracked tokenExpires = this.expiresOptions[0];

  // Initial value should be 'read'
  @tracked tokenPermission = this.tokenPermissionOptions[0];

  @tracked isAwaitingResponse;

  @tracked wasActionSuccessful;

  @tracked isCopyButtonDisabled;

  @tracked newToken;

  constructor() {
    super(...arguments);

    this.isAwaitingResponse = false;
    this.wasActionSuccessful = false;
    this.isCopyButtonDisabled = false;
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
  setTokenExpires(option) {
    this.tokenExpires = option;
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
        expiresAt: this.tokenExpires.getExpiresAt(),
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
