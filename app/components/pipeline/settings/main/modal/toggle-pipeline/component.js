import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';

export default class PipelineSettingsMainModalTogglePipelineComponent extends Component {
  @service shuttle;

  @service('pipeline-page-state') pipelinePageState;

  @tracked errorMessage = null;

  @tracked stateChangeMessage = '';

  @tracked isSubmitting = false;

  pipeline;

  constructor() {
    super(...arguments);

    this.pipeline = this.pipelinePageState.getPipeline();
  }

  get isDisabled() {
    return this.pipeline.state === 'DISABLED';
  }

  get modalTitle() {
    const name = this.pipeline.name || this.pipeline.id;

    return this.isDisabled
      ? `Enable pipeline: ${name}?`
      : `Disable pipeline: ${name}?`;
  }

  get actionButtonText() {
    return this.isDisabled ? 'Enable' : 'Disable';
  }

  get pendingText() {
    return this.isDisabled ? 'Enabling' : 'Disabling';
  }

  get newState() {
    return this.isDisabled ? 'ACTIVE' : 'DISABLED';
  }

  @action
  async togglePipeline() {
    this.isSubmitting = true;

    const payload = { state: this.newState };

    if (this.stateChangeMessage) {
      payload.stateChangeMessage = this.stateChangeMessage;
    }

    await this.shuttle
      .fetchFromApi('put', `/pipelines/${this.pipeline.id}`, payload)
      .then(pipeline => {
        this.pipelinePageState.setPipeline(pipeline);
        this.args.closeModal(true);
      })
      .catch(err => {
        this.errorMessage = err.message;
        this.isSubmitting = false;
      });
  }
}
