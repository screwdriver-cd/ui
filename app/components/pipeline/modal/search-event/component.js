import Component from '@glimmer/component';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';

export default class PipelineModalSearchEventComponent extends Component {
  @service shuttle;

  @tracked sha;

  @tracked searchResults;

  @tracked inputClass;

  constructor() {
    super(...arguments);

    this.searchResults = [];
    this.inputClass = null;
  }

  @action
  handleInput(inputEvent) {
    const inputValue = inputEvent.target.value;

    if (inputValue && inputValue.length > 0) {
      if (!/^[0-9a-f]{1,40}$/.test(inputValue)) {
        if (!this.inputClass) {
          this.inputClass = 'invalid';
        }
      } else {
        this.inputClass = null;
        this.shuttle
          .fetchFromApi(
            'get',
            `/pipelines/${this.args.pipeline.id}/events?sha=${inputValue}`
          )
          .then(events => {
            this.searchResults = events;
          });
      }
    } else {
      this.inputClass = null;
    }
  }

  @action
  handleKeyPress(event) {
    if (event.key === 'Escape') {
      if (this.sha?.length > 0) {
        event.stopImmediatePropagation();
        this.sha = null;
        this.searchResults = [];
      }
    }
  }
}
