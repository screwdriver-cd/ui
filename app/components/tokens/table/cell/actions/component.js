import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class TokensTableCellActionsComponent extends Component {
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
      this.args.record.onUpdated(updatedToken);
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
      this.args.record.onDeleted(deletedToken);
    }
  }
}
