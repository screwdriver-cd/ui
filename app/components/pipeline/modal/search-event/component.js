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

  searchField;

  constructor() {
    super(...arguments);

    this.searchResults = [];
    this.invalidSha = false;
    this.searchField = null;

    this.isPr = this.router.currentRouteName.includes('pulls');
  }

  @action
  setSelection(selected) {
    this.searchField = selected;
  }

  @action
  handleInput(inputEvent) {
    const inputValue = inputEvent.target.value.trim();

    // Validate searchValue and determine urlFilter
    const validHex = /^[0-9a-f]{1,40}$/;

    let urlFilter = this.searchField || 'message'; // Default filter

    if (this.searchField === 'sha' && inputValue) {
      this.invalidSha = !validHex.test(inputValue);
    }

    // Construct search URL with proper query parameters
    const baseUrl = `/pipelines/${
      this.args.pipeline.id
    }/events?${urlFilter}=${encodeURIComponent(inputValue)}`;
    const url = `${baseUrl}&type=${this.isPr ? 'pr' : 'pipeline'}`;

    this.shuttle.fetchFromApi('get', url).then(events => {
      this.searchResults = events;
    });
  }

  @action
  handleKeyPress(event) {
    if (event.key === 'Escape') {
      if (this.searchInput?.length > 0) {
        event.stopImmediatePropagation();
        this.searchInput = null;
        this.searchResults = [];
        this.invalidSha = false;
      }
    }
  }
}
