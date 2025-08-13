import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class PipelineSettingsJobsComponent extends Component {
  @tracked disableEnableMultipleJobsButton = false;

  @tracked disableDisableMultipleJobsButton = false;

  @tracked isToggleMultiple = false;

  @tracked isEnable = false;

  @action
  toggleMultiple(isEnable) {
    this.isToggleMultiple = true;
    this.isEnable = isEnable;

    if (isEnable) {
      this.disableEnableMultipleJobsButton = true;
      this.disableDisableMultipleJobsButton = false;
    } else {
      this.disableEnableMultipleJobsButton = false;
      this.disableDisableMultipleJobsButton = true;
    }
  }

  @action
  cancelToggleMultiple() {
    this.isToggleMultiple = false;
    this.disableEnableMultipleJobsButton = false;
    this.disableDisableMultipleJobsButton = false;
  }
}
