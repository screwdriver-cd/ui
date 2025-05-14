import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';

export default class PipelineSecretsAndTokensSecretsComponent extends Component {
  @service('pipeline-page-state') pipelinePageState;

  @service('pipeline-secrets') pipelineSecrets;

  @tracked errorMessage;

  @tracked isCreateSecretButtonDisabled;

  @tracked isCreateSecretModalOpen;

  @tracked pipelineId;

  @tracked secrets;

  @tracked parentPipelineId;

  constructor() {
    super(...arguments);

    this.isCreateSecretButtonDisabled = true;
    this.isCreateSecretModalOpen = false;
    this.pipelineId = this.args.pipelineId;
    this.parentPipelineId =
      this.pipelinePageState.getPipeline().configPipelineId;
    this.secrets = [];

    this.fetchSecrets();
  }

  fetchSecrets() {
    this.pipelineSecrets
      .fetchSecrets(this.pipelineId, this.parentPipelineId)
      .then(() => {
        this.isCreateSecretButtonDisabled = false;
        this.secrets = Array.from(this.pipelineSecrets.secrets.values());
      })
      .catch(errorMessage => {
        this.errorMessage = errorMessage;
      });
  }

  @action
  secretNames() {
    return this.pipelineSecrets.secretNames;
  }

  @action
  updatePipelineSecrets(element, [pipelineId]) {
    this.pipelineId = pipelineId;
    this.parentPipelineId =
      this.pipelinePageState.getPipeline().configPipelineId;

    this.fetchSecrets();
  }

  @action
  showCreateSecretModal() {
    this.isCreateSecretModalOpen = true;
  }

  @action
  closeCreateSecretModal(newSecret) {
    this.isCreateSecretModalOpen = false;

    if (newSecret) {
      this.pipelineSecrets.addSecret(newSecret);
      this.secrets = [newSecret];
    }
  }
}
