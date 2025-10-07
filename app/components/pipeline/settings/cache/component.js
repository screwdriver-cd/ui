import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class PipelineSettingsCacheComponent extends Component {
  @tracked isClearPipelineCacheModalOpen = false;

  @tracked isClearPipelineCacheButtonDisabled = false;

  @tracked showTable;

  pipelineId;

  constructor() {
    super(...arguments);

    this.pipelineId = this.args.pipelineId;
    this.showTable = true;
  }

  rerenderTable() {
    this.showTable = false;
  }

  @action
  update(element, [pipelineId]) {
    if (pipelineId !== this.pipelineId) {
      this.pipelineId = pipelineId;
      this.rerenderTable();
    }
  }

  @action
  openClearPipelineCacheModal() {
    this.isClearPipelineCacheModalOpen = true;
  }

  @action
  closePipelineCacheModal(wasSuccessful) {
    this.isClearPipelineCacheModalOpen = false;

    if (wasSuccessful) {
      this.isClearPipelineCacheButtonDisabled = true;
    }
  }

  @action
  onTableDestroy() {
    this.showTable = true;
  }
}
