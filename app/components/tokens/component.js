import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';
import _ from 'lodash';

export default class TokensComponent extends Component {
  @service shuttle;

  @service('tokens') tokensService;

  @tracked errorMessage;

  @tracked isCreateTokenButtonDisabled;

  @tracked isCreateTokenModalOpen;

  @tracked tokens;

  pipelineId;

  constructor() {
    super(...arguments);

    this.pipelineId = this.args.pipelineId;
    this.initialize();
  }

  initialize() {
    this.isCreateTokenButtonDisabled = true;
    this.isCreateTokenModalOpen = false;
    this.tokens = [];

    this.tokensService
      .fetchTokens(this.pipelineId)
      .then(() => {
        this.isCreateTokenButtonDisabled = false;
        this.tokens = this.tokensService.tokens;
      })
      .catch(errorMessage => {
        this.errorMessage = errorMessage;
      });
  }

  get type() {
    // eslint-disable-next-line ember/no-string-prototype-extensions
    return _.capitalize(this.args.type);
  }

  get scope() {
    return this.args.type === 'pipeline' ? 'this pipeline' : 'your account';
  }

  @action
  update(element, [pipelineId]) {
    this.pipelineId = pipelineId;
    this.initialize();
  }

  @action
  showCreateTokenModal() {
    this.isCreateTokenModalOpen = true;
  }

  @action
  closeCreateTokenModal(newToken) {
    this.isCreateTokenModalOpen = false;

    if (newToken) {
      this.tokens = [newToken];
    }
  }
}
