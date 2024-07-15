import Component from '@glimmer/component';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';

export default class PipelineModalToggleJobComponent extends Component {
  @service shuttle;

  @tracked isDisabled = false;

  @tracked stateChangeMessage = '';

  @tracked errorMessage = null;

  @tracked successMessage = null;

  @action
  async updateJob() {
    const payload = {
      state:
        this.args.toggleAction.toLowerCase() === 'disable'
          ? 'DISABLED'
          : 'ENABLED'
    };

    if (this.stateChangeMessage.length > 0) {
      payload.stateChangeMessage = this.stateChangeMessage;
    }

    await this.shuttle
      .fetchFromApi('put', `/jobs/${this.args.jobId}`, payload)
      .then(() => {
        this.successMessage = `Job ${this.args.toggleAction.toLowerCase()}d successfully`;
        this.isDisabled = true;
      })
      .catch(err => {
        this.errorMessage = err.message;
      });
  }
}
