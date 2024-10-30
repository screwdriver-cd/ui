import Component from '@glimmer/component';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';

export default class PipelineModalSearchEventComponent extends Component {
  @service shuttle;

  @tracked sha;

  @tracked searchResults;

  @tracked invalidSha;

  constructor() {
    super(...arguments);

    this.searchResults = [];
    this.invalidSha = false;
  }

  @action
  handleInput(inputEvent) {
    const inputValue = inputEvent.target.value;

    if (inputValue && inputValue.length > 0) {
      const validHex = /^[0-9a-f]{1,40}$/;

      if (!validHex.test(inputValue)) {
        this.invalidSha = true;
      } else {
        this.invalidSha = false;

        this.shuttle
          .fetchFromApi(
            'get',
            `/pipelines/${this.args.pipeline.id}/events?sha=${inputValue}`
          )
          .then(events => {
            this.searchResults = events;
          });
      }
    }
  }

  @action
  handleKeyPress(event) {
    if (event.key === 'Escape') {
      if (this.sha?.length > 0) {
        event.stopImmediatePropagation();
        this.sha = null;
        this.searchResults = [];
        this.invalidSha = false;
      }
    }
  }
}
