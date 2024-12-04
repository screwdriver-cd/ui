import Component from '@glimmer/component';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';

export default class PipelineModalSearchEventComponent extends Component {
  @service router;

  @service shuttle;

  @tracked searchField = 'message';

  @tracked searchInput = null;

  @tracked searchResults = [];

  @tracked invalidSha = false;

  isPr = this.router.currentRouteName.includes('pulls');

  searchFieldOptions = ['message', 'sha', 'creator', 'author'];

  @action
  handleInput(inputEvent) {
    const inputValue = inputEvent?.target?.value?.trim() || '';

    if (!inputValue) {
      this.searchResults = [];
      this.invalidSha = false;
      this.searchInput = null;

      return;
    }

    const searchField = this.searchField || 'message'; // Default filter

    // Validate SHA
    if (searchField === 'sha' && inputValue) {
      const validHex = /^[0-9a-f]{1,40}$/;

      this.invalidSha = !validHex.test(inputValue);

      if (this.invalidSha) {
        this.searchResults = [];

        return;
      }
    }

    // Construct search URL with proper query parameters
    const baseUrl = `/pipelines/${
      this.args.pipeline.id
    }/events?${searchField}=${encodeURIComponent(inputValue)}`;
    const url = `${baseUrl}&type=${this.isPr ? 'pr' : 'pipeline'}`;

    this.shuttle.fetchFromApi('get', url).then(events => {
      this.searchResults = events;
    });
  }

  @action
  setSearchField(event) {
    this.searchField = event.target.value;
    this.invalidSha = false;
    this.searchResults = [];
    this.handleInput({ target: { value: this.searchInput } });
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
