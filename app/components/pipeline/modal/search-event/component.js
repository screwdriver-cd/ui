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
    const inputValue = inputEvent.target.value.trim();
    const [searchField, ...searchParts] = inputValue.split(':');

    let searchValue = searchParts.join(':').trim(); // In case the search value has a colon

    // Validate searchValue and determine urlFilter
    const validHex = /^[0-9a-f]{1,40}$/;
    const validFields = ['sha', 'author', 'creator', 'message'];

    let urlFilter = 'message'; // Default filter

    if (searchField === 'sha' && searchValue) {
      this.invalidSha = !validHex.test(searchValue);
      if (!this.invalidSha) {
        urlFilter = 'sha';
      }
    } else if (validFields.includes(searchField)) {
      urlFilter = searchField;
    } else {
      // Default case, use message as filter
      searchValue = inputValue;
    }

    // Construct search URL with proper query parameters
    const baseUrl = `/pipelines/${
      this.args.pipeline.id
    }/events?${urlFilter}=${encodeURIComponent(searchValue)}`;
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
