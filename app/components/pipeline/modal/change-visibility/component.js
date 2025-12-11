import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';

export default class PipelineModalChangeVisibilityComponent extends Component {
  @service shuttle;

  @service('pipeline-page-state') pipelinePageState;

  @tracked errorMessage = null;

  pipeline;

  constructor() {
    super(...arguments);

    this.pipeline = this.pipelinePageState.getPipeline();
  }

  get isPublic() {
    return this.pipeline.settings?.public ?? false;
  }

  @action
  async changeVisibility() {
    await this.shuttle
      .fetchFromApi('put', `/pipelines/${this.pipeline.id}`, {
        settings: {
          public: !this.isPublic
        }
      })
      .then(pipeline => {
        this.pipelinePageState.setPipeline(pipeline);
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
