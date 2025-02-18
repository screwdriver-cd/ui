import Component from '@glimmer/component';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';

export default class PipelineModalStopBuildComponent extends Component {
  @service shuttle;

  @tracked errorMessage = null;

  @action
  async stopBuild() {
    if (this.args.eventId) {
      await this.shuttle
        .fetchFromApi('put', `/events/${this.args.eventId}/stop`)
        .then(() => {
          this.args.closeModal();
        })
        .catch(err => {
          this.errorMessage = err.message;
        });
    } else {
      await this.shuttle
        .fetchFromApi('put', `/builds/${this.args.buildId}`, {
          status: 'ABORTED'
        })
        .then(() => {
          this.args.closeModal();
        })
        .catch(err => {
          this.errorMessage = err.message;
        });
    }
  }
}
