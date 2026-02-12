import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { isInactivePipeline } from 'screwdriver-ui/utils/pipeline';

export default class PipelineChildrenTableCellActionsComponent extends Component {
  @tracked isDeletePipelineModalOpen;

  constructor() {
    super(...arguments);

    this.isDeletePipelineModalOpen = false;
  }

  get showTrashIcon() {
    return isInactivePipeline(this.args.record);
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
