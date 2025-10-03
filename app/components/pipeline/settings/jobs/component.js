import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class PipelineSettingsJobsComponent extends Component {
  @tracked disableEnableMultipleJobsButton;

  @tracked disableDisableMultipleJobsButton;

  @tracked isToggleMultiple;

  @tracked isEnable;

  @tracked showTable;

  pipelineId;

  constructor() {
    super(...arguments);

    this.pipelineId = this.args.pipelineId;
    this.initialize();
    this.showTable = true;
  }

  initialize() {
    this.disableEnableMultipleJobsButton = false;
    this.disableDisableMultipleJobsButton = false;
    this.isToggleMultiple = false;
    this.isEnable = false;
  }

  rerenderTable() {
    this.showTable = false;
  }

  @action
  update(element, [pipelineId]) {
    if (pipelineId !== this.pipelineId) {
      this.pipelineId = pipelineId;

      this.initialize();
      this.rerenderTable();
    }
  }

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
    this.rerenderTable();
  }

  @action
  cancelToggleMultiple() {
    this.isToggleMultiple = false;
    this.disableEnableMultipleJobsButton = false;
    this.disableDisableMultipleJobsButton = false;
    this.rerenderTable();
  }

  @action
  onTableDestroy() {
    this.showTable = true;
  }
}
