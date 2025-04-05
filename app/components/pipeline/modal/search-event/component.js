import Component from '@glimmer/component';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';

export default class PipelineModalSearchEventComponent extends Component {
  @service shuttle;

  @service pipelinePageState;

  @tracked searchField = 'message';

  @tracked searchInput = null;

  @tracked searchResults = [];

  @tracked invalidSha = false;

  searchFieldOptions = ['message', 'sha', 'creator', 'author'];

  @action
  handleInput(inputEvent) {
    const inputValue = inputEvent?.target?.value?.trim() || this.searchInput;

    if (!inputValue) {
      this.searchResults = [];
      this.invalidSha = false;
      this.searchInput = null;

      return;
    }

    // Validate SHA
    if (this.searchField === 'sha') {
      const validHex = /^[0-9a-f]{1,40}$/;

      this.invalidSha = !validHex.test(inputValue);

      if (this.invalidSha) {
        this.searchResults = [];

        return;
      }
    }

    // Construct search URL with proper query parameters
    const baseUrl = `/pipelines/${this.pipelinePageState.getPipelineId()}/events?${
      this.searchField
    }=${encodeURIComponent(inputValue)}`;
    const url = `${baseUrl}&type=${
      this.pipelinePageState.getIsPr() ? 'pr' : 'pipeline'
    }`;

    this.shuttle.fetchFromApi('get', url).then(events => {
      this.searchResults = events;
    });
  }

  @action
  setSearchField(searchField) {
    this.searchField = searchField;
    this.handleInput();
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
