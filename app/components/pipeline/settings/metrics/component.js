import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class PipelineSettingsMetricsComponent extends Component {
  @tracked disableIncludeMultipleJobsButton;

  @tracked disableExcludeMultipleJobsButton;

  @tracked isToggleMultiple;

  @tracked isInclude;

  @tracked showTable;

  pipelineId;

  constructor() {
    super(...arguments);

    this.pipelineId = this.args.pipelineId;
    this.showTable = true;
    this.initialize();
  }

  initialize() {
    this.disableIncludeMultipleJobsButton = false;
    this.disableExcludeMultipleJobsButton = false;
    this.isToggleMultiple = false;
    this.isInclude = false;
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
  toggleMultiple(isInclude) {
    this.isInclude = isInclude;

    if (isInclude) {
      this.disableIncludeMultipleJobsButton = true;
      this.disableExcludeMultipleJobsButton = false;
    } else {
      this.disableIncludeMultipleJobsButton = false;
      this.disableExcludeMultipleJobsButton = true;
    }

    this.isToggleMultiple = true;

    this.rerenderTable();
  }

  @action
  cancelToggleMultiple() {
    this.isToggleMultiple = false;
    this.disableIncludeMultipleJobsButton = false;
    this.disableExcludeMultipleJobsButton = false;

    this.rerenderTable();
  }

  @action
  onDestroyTable() {
    this.showTable = true;
  }
}
