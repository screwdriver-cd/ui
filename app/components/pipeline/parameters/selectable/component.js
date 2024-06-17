import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class PipelineParametersSelectableComponent extends Component {
  @tracked value;

  inputValue;

  constructor() {
    super(...arguments);

    this.value = this.args.parameter.value;
  }

  @action
  selectOption(value) {
    this.value = value;
    this.args.onSelectValue(this.args.parameter, value);
  }

  @action
  handleInput(value) {
    this.inputValue = value;
  }

  @action
  handleKeydown(_dropdown, e) {
    switch (e.keyCode) {
      case 13:
        this.selectOption(this.inputValue);
        break;
      case 27:
        // Escape key pressed - prevent further propagation of event
        e.stopImmediatePropagation();
        break;
      default:
        break;
    }
  }
}
