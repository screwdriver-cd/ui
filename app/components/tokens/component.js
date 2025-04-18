import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';
import _ from 'lodash';

export default class TokensComponent extends Component {
  @service shuttle;

  @service pipelinePageState;

  @tracked errorMessage;

  @tracked isCreateTokenButtonDisabled;

  @tracked isCreateTokenModalOpen;

  @tracked tokens;

  constructor() {
    super(...arguments);

    this.isCreateTokenButtonDisabled = true;
    this.isCreateTokenModalOpen = false;
    this.tokens = [];
  }

  get type() {
    // eslint-disable-next-line ember/no-string-prototype-extensions
    return _.capitalize(this.args.type);
  }

  get scope() {
    return this.args.type === 'pipeline' ? 'this pipeline' : 'your account';
  }

  @action
  async fetchTokens() {
    const pipelineId = this.pipelinePageState.getPipelineId();
    const url = pipelineId ? `/pipelines/${pipelineId}/tokens` : '/tokens';

    await this.shuttle
      .fetchFromApi('get', url)
      .then(tokens => {
        this.tokens = tokens;
        this.isCreateTokenButtonDisabled = false;
      })
      .catch(err => {
        this.errorMessage = err.message;
      });
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
