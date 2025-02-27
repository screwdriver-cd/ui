import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';

export default class PipelineModalStartChildrenComponent extends Component {
  @service shuttle;

  @service pipelinePageState;

  @tracked errorMessage = null;

  @tracked isAwaitingResponse = false;

  @tracked wasActionSuccessful = false;

  get isStartAllButtonDisabled() {
    return this.wasActionSuccessful || this.isAwaitingResponse;
  }

  @action
  async startChildren() {
    this.isAwaitingResponse = true;

    await this.shuttle
      .fetchFromApi(
        'post',
        `/pipelines/${this.pipelinePageState.getPipelineId()}/startall`
      )
      .then(() => {
        this.args.closeModal();
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
