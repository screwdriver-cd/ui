import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class PipelineSettingsCacheComponent extends Component {
  @tracked isClearPipelineCacheModalOpen = false;

  @tracked isClearPipelineCacheButtonDisabled = false;

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
}
