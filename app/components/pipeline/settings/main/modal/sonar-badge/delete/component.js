import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';

export default class PipelineSettingsMainModalSonarBadgeDeleteComponent extends Component {
  @service('shuttle') shuttle;

  @service('pipeline-page-state') pipelinePageState;

  @tracked errorMessage;

  @tracked isAwaitingResponse = false;

  get isDisabled() {
    return this.isAwaitingResponse;
  }

  @action
  async deleteBadge() {
    const pipelineId = this.pipelinePageState.getPipelineId();

    this.isAwaitingResponse = true;

    return this.shuttle
      .fetchFromApi('put', `/pipelines/${pipelineId}`, {
        badges: {
          sonar: {}
        }
      })
      .then(pipeline => {
        this.pipelinePageState.setPipeline(pipeline);
        this.pipelinePageState.forceReloadPipelineHeader();
        this.args.closeModal(true);
      })
      .catch(err => {
        this.errorMessage = err.message;
        this.isAwaitingResponse = false;
      });
  }
}
