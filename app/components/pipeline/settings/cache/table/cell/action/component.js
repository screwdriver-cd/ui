import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class PipelineSettingsCacheTableCellActionComponent extends Component {
  @tracked isClearJobCacheModalOpen = false;

  get job() {
    return [this.args.record];
  }

  @action
  openClearJobCacheModal() {
    this.isClearJobCacheModalOpen = true;
  }

  @action
  closeClearJobCacheModal(wasSuccessful) {
    this.isClearJobCacheModalOpen = false;

    if (wasSuccessful) {
      this.args.record.onCacheActionComplete(true);
    }
  }
}
