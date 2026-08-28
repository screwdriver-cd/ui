import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { toCustomLocaleString } from 'screwdriver-ui/utils/time-range';
import {
  expiresOptions,
  tokenPermissionOptions
} from 'screwdriver-ui/components/tokens/modal/token-options';

export default class TokensModalEditComponent extends Component {
  expiresOptions = expiresOptions;

  tokenPermissionOptions = tokenPermissionOptions;

  @service shuttle;

  @service('tokens') tokensService;

  @service pipelinePageState;

  @tracked errorMessage;

  @tracked tokenName;

  @tracked tokenDescription;

  @tracked tokenExpires;

  @tracked tokenPermission;

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
      this.isTokenNameInvalid() ||
      (!this.tokenName &&
        !this.tokenDescription &&
        !this.tokenExpires &&
        !this.tokenPermission)
    );
  }

  get expiresDate() {
    if (this.args.token.expiresAt) {
      return toCustomLocaleString(new Date(this.args.token.expiresAt));
    }

    return 'No expiration';
  }

  @action
  setTokenExpires(option) {
    this.tokenExpires = option;
  }

  @action
  setTokenPermission(permission) {
    this.tokenPermission = permission;
  }

  @action
  async editToken() {
    this.isAwaitingResponse = true;

    const updateUrl = `/tokens/${this.args.token.id}`;
    const pipelineId = this.pipelinePageState.getPipelineId();
    const url = pipelineId ? `/pipelines/${pipelineId}${updateUrl}` : updateUrl;

    const body = {
      name: this.tokenName,
      description: this.tokenDescription
    };

    if (this.tokenExpires) {
      body.expiresAt = this.tokenExpires.getExpiresAt();
    }

    if (this.tokenPermission) {
      body.options = {
        permission: this.tokenPermission
      };
    }

    return this.shuttle
      .fetchFromApi('put', url, body)
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
