import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';

export default class PipelineModalDeletePipelineComponent extends Component {
  @service router;

  @service shuttle;

  @tracked errorMessage = null;

  @tracked isAwaitingResponse = false;

  @tracked wasActionSuccessful = false;

  get isDeleteButtonDisabled() {
    return this.wasActionSuccessful || this.isAwaitingResponse;
  }

  @action
  async deletePipeline() {
    this.isAwaitingResponse = true;

    await this.shuttle
      .fetchFromApi('delete', `/pipelines/${this.args.pipelineId}`)
      .then(() => {
        this.args.closeModal(true);
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
