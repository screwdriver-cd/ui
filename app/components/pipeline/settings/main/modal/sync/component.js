import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';

export default class PipelineSettingsMainModalSyncComponent extends Component {
  @service('shuttle') shuttle;

  @service('pipeline-page-state') pipelinePageState;

  @service router;

  @tracked errorMessage;

  @tracked isAwaitingResponse;

  @tracked wasActionSuccessful;

  get headerText() {
    switch (this.args.syncType) {
      case 'webhooks':
        return 'Sync Webhooks';
      case 'pullrequests':
        return 'Sync Pull Requests';
      default:
        return 'Sync Pipeline';
    }
  }

  get syncMessageText() {
    switch (this.args.syncType) {
      case 'webhooks':
        return 'This will sync the webhooks for the pipeline.  Syncing webhooks will ensure that the pipeline will be notified of the corresponding actions taken in your repository.';
      case 'pullrequests':
        return 'This will sync the pull requests for the pipeline.  Syncing pull requests will ensure that the pull requests displayed in the pipeline are the same as those in your repository.';
      default:
        return 'This will sync the pipeline to ensure that various settings and configurations of your pipeline are displayed properly.';
    }
  }

  get isSubmitButtonDisabled() {
    return !!(this.wasActionSuccessful || this.isAwaitingResponse);
  }

  @action
  async sync() {
    this.isAwaitingResponse = true;

    let url = `/pipelines/${this.pipelinePageState.getPipelineId()}/sync`;

    switch (this.args.syncType) {
      case 'webhooks':
      case 'pullrequests':
        url += `/${this.args.syncType}`;
        break;
      default:
        break;
    }

    return this.shuttle
      .fetchFromApi('post', url)
      .then(async () => {
        if (this.args.syncType === 'pipeline') {
          await this.shuttle
            .fetchFromApi(
              'get',
              `/pipelines/${this.pipelinePageState.getPipelineId()}`
            )
            .then(pipeline => {
              this.pipelinePageState.setPipeline(pipeline);
              this.pipelinePageState.forceReloadPipelineHeader();
            })
            .catch(() => {
              this.router.refresh();
            });
        }

        this.wasActionSuccessful = true;
        this.args.closeModal();
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
