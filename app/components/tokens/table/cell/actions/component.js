import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';

export default class TokensTableCellActionsComponent extends Component {
  @service('tokens') tokensService;

  @tracked isEditTokenModalOpen;

  @tracked isRefreshTokenModalOpen;

  @tracked isDeleteTokenModalOpen;

  constructor() {
    super(...arguments);

    this.isEditTokenModalOpen = false;
    this.isRefreshTokenModalOpen = false;
    this.isDeleteTokenModalOpen = false;
  }

  @action
  showEditTokenModal() {
    this.isEditTokenModalOpen = true;
  }

  @action
  closeEditTokenModal(updatedToken) {
    this.isEditTokenModalOpen = false;

    if (updatedToken) {
      this.tokensService.updateToken(updatedToken);
      this.args.record.onSuccess();
    }
  }

  @action
  showRefreshTokenModal() {
    this.isRefreshTokenModalOpen = true;
  }

  @action
  closeRefreshTokenModal() {
    this.isRefreshTokenModalOpen = false;
  }

  @action
  showDeleteTokenModal() {
    this.isDeleteTokenModalOpen = true;
  }

  @action
  closeDeleteTokenModal(deletedToken) {
    this.isDeleteTokenModalOpen = false;

    if (deletedToken) {
      this.tokensService.deleteToken(deletedToken);
      this.args.record.onSuccess();
    }
  }
}
