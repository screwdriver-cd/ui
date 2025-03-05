import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class PipelineChildrenTableCellActionsComponent extends Component {
  @tracked isDeletePipelineModalOpen;

  constructor() {
    super(...arguments);

    this.isDeletePipelineModalOpen = false;
  }

  @action
  showDeletePipelineModal() {
    this.isDeletePipelineModalOpen = true;
  }

  @action
  closeDeletePipelineModal(deletedPipeline) {
    this.isDeletePipelineModalOpen = false;

    if (deletedPipeline) {
      this.args.record.onPipelineDeleted(this.args.record.id);
    }
  }
}
