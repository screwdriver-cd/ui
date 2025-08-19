import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class PipelineSettingsMetricsTableCellToggleComponent extends Component {
  @tracked showModal = false;

  get elementId() {
    return `toggle-job-${this.args.record.id}`;
  }

  get jobs() {
    return [this.args.record];
  }

  @action
  toggleJob() {
    this.showModal = true;
  }

  @action
  closeModal(updated) {
    this.showModal = false;

    if (updated) {
      this.args.record.onJobUpdated();
    }
  }
}
