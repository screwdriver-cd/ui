import Component from '@glimmer/component';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';

export default class PipelineModalStopBuildComponent extends Component {
  @service shuttle;

  @tracked isDisabled = false;

  @tracked errorMessage = null;

  @tracked successMessage = null;

  @action
  async stopBuild() {
    await this.shuttle
      .fetchFromApi('put', `/builds/${this.args.buildId}`, {
        status: 'ABORTED'
      })
      .then(() => {
        this.successMessage = 'Build stopped successfully';
        this.isDisabled = true;
      })
      .catch(err => {
        this.errorMessage = err.message;
      });
  }
}
