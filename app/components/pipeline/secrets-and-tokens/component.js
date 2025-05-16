import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class PipelineSecretsAndTokensComponent extends Component {
  @tracked activeTab;

  @tracked pipelineId;

  constructor() {
    super(...arguments);

    this.activeTab = 'secrets';
    this.pipelineId = this.args.pipelineId;
  }

  @action
  setActiveTab(tab) {
    this.activeTab = tab;
  }

  @action
  updatePipeline(element, [pipelineId]) {
    this.pipelineId = pipelineId;
  }
}
