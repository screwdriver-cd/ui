import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class PipelineChildrenComponent extends Component {
  @tracked isStartAllChildrenModalOpen;

  @tracked childrenPipelineStarted = false;

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
}
