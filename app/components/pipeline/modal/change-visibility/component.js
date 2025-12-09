import Component from '@glimmer/component';
import { action } from '@ember/object';

export default class PipelineModalChangeVisibilityComponent extends Component {
  @action
  async changeVisibility() {
    this.args.closeModal(true);
  }
}
