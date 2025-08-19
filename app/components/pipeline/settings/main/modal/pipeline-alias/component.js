import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';

export default class PipelineSettingsMainModalPipelineAliasComponent extends Component {
  @service('shuttle') shuttle;

  @service('pipeline-page-state') pipelinePageState;

  @tracked errorMessage;

  @tracked alias;

  @tracked isAwaitingResponse = false;

  pipeline;

  constructor() {
    super(...arguments);

    this.pipeline = this.pipelinePageState.getPipeline();
    this.alias = this.pipeline.settings.aliasName;
  }

  get isDisabled() {
    if (this.isAwaitingResponse) {
      return true;
    }

    return this.alias === this.pipeline.settings.aliasName;
  }

  @action
  async updateAlias() {
    this.isAwaitingResponse = true;

    return this.shuttle
      .fetchFromApi('put', `/pipelines/${this.pipeline.id}`, {
        settings: {
          aliasName: this.alias
        }
      })
      .then(pipeline => {
        this.pipelinePageState.setPipeline(pipeline);
        this.args.closeModal(true);
      })
      .catch(err => {
        this.errorMessage = err.message;
        this.isAwaitingResponse = false;
      });
  }
}
