import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';

export default class PipelineWorkflowEventRailModalSyncPrComponent extends Component {
  @service('shuttle') shuttle;

  @service('pipeline-page-state') pipelinePageState;

  @tracked isDisabled = false;

  @tracked errorMessage;

  @action
  async syncPr() {
    this.isDisabled = true;

    await this.shuttle
      .fetchFromApi(
        'post',
        `/pipelines/${this.pipelinePageState.getPipelineId()}/sync/pullrequests`
      )
      .then(() => {
        this.args.closeModal();
      })
      .catch(err => {
        this.errorMessage = err.message;
        this.isDisabled = false;
      });
  }
}
