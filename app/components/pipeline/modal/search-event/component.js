import Component from '@glimmer/component';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';

export default class PipelineModalSearchEventComponent extends Component {
  @service router;

  @service shuttle;

  @tracked sha;

  @tracked searchResults;

  @tracked invalidSha;

  isPr;

  constructor() {
    super(...arguments);

    this.searchResults = [];
    this.invalidSha = false;

    this.isPr = this.router.currentRouteName.includes('pulls');
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

        const baseUrl = `/pipelines/${this.args.pipeline.id}/events?sha=${inputValue}&type=`;
        const url = this.isPr ? `${baseUrl}pr` : `${baseUrl}pipeline`;

        this.shuttle.fetchFromApi('get', url).then(events => {
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
