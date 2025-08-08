import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class PipelineSettingsMetricsComponent extends Component {
  @tracked disableIncludeMultipleJobsButton = false;

  @tracked disableExcludeMultipleJobsButton = false;

  @tracked isToggleMultiple = false;

  @tracked isInclude = false;

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
  }

  @action
  cancelToggleMultiple() {
    this.isToggleMultiple = false;
    this.disableIncludeMultipleJobsButton = false;
    this.disableExcludeMultipleJobsButton = false;
  }
}
