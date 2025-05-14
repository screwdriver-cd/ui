import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';

export default class PipelineSecretsAndTokensTableCellActionsComponent extends Component {
  @service('pipeline-secrets') pipelineSecrets;

  @tracked isEditSecretModalOpen = false;

  @tracked isDeleteSecretModalOpen = false;

  @action
  showEditSecretModal() {
    this.isEditSecretModalOpen = true;
  }

  @action
  closeEditSecretModal(updatedSecret) {
    this.isEditSecretModalOpen = false;

    if (updatedSecret) {
      this.pipelineSecrets.replaceSecret(updatedSecret);
      this.args.record.onSuccess();
    }
  }

  @action
  showDeleteSecretModal() {
    this.isDeleteSecretModalOpen = true;
  }

  @action
  closeDeleteSecretModal(deletedSecret) {
    this.isDeleteSecretModalOpen = false;

    if (deletedSecret) {
      this.pipelineSecrets.deleteSecret(deletedSecret);
      this.args.record.onSuccess();
    }
  }
}
