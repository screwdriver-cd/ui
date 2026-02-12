import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { hasInactivePipelines } from 'screwdriver-ui/utils/pipeline';

export default class PipelineChildrenComponent extends Component {
  @tracked isStartAllChildrenModalOpen;

  @tracked childrenPipelineStarted = false;

  @tracked showTable;

  @service('pipeline-page-state') pipelinePageState;

  pipelineId;

  constructor() {
    super(...arguments);

    this.pipelineId = this.args.pipelineId;
    this.showTable = true;
  }

  get hasInactivePipelines() {
    return hasInactivePipelines(this.pipelinePageState.getChildPipelines());
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
  showStartAllChildrenModal() {
    this.isStartAllChildrenModalOpen = true;
  }

  @action
  closeStartAllChildrenModal(childrenPipelineStarted) {
    this.isStartAllChildrenModalOpen = false;

    if (childrenPipelineStarted) {
      this.childrenPipelineStarted = true;
    }
  }

  @action
  onTableDestroy() {
    this.showTable = true;
  }
}
