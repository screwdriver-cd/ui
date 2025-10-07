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
        `/pipelines/${this.pipelinePageState.getPipelineId()}/startall`,
        null,
        true
      )
      .then(() => {
        this.args.closeModal(true);
        this.wasActionSuccessful = true;
      })
      .catch(err => {
        if (err.jqXHR.status >= 200 && err.jqXHR.status < 300) {
          this.args.closeModal(true);
          this.wasActionSuccessful = true;
        } else {
          this.wasActionSuccessful = false;
          this.errorMessage = err.response.message;
        }
      })
      .finally(() => {
        this.isAwaitingResponse = false;
      });
  }
}
