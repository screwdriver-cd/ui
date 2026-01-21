import Component from '@glimmer/component';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { cancel, debounce } from '@ember/runloop';

export default class PipelineModalSearchEventComponent extends Component {
  @service('shuttle') shuttle;

  @service('pipeline-page-state') pipelinePageState;

  @tracked searchField = 'message';

  @tracked searchInput = null;

  @tracked searchResults = [];

  @tracked invalidSha = false;

  @tracked isLoading = false;

  @tracked hasMore = true;

  @tracked page = 1;

  count = 10;

  _searchDebounceTimer = null;

  debounceDelayMs = 500;

  willDestroy() {
    super.willDestroy();

    if (this._searchDebounceTimer) {
      cancel(this._searchDebounceTimer);
    }
  }

  searchFieldOptions = ['message', 'sha', 'creator', 'author'];

  _cancelPendingSearch() {
    if (this._searchDebounceTimer) {
      cancel(this._searchDebounceTimer);
      this._searchDebounceTimer = null;
    }
  }

  _executeSearch(inputValue, { append = false } = {}) {
    // Construct search URL with proper query parameters
    const baseUrl = `/pipelines/${this.pipelinePageState.getPipelineId()}/events?${
      this.searchField
    }=${encodeURIComponent(inputValue)}`;
    const url = `${baseUrl}&type=${
      this.pipelinePageState.getIsPr() ? 'pr' : 'pipeline'
    }&page=${this.page}&count=${this.count}`;

    this.isLoading = true;

    this.shuttle
      .fetchFromApi('get', url)
      .then(events => {
        if (append) {
          this.searchResults = [...this.searchResults, ...events];
        } else {
          this.searchResults = events;
        }

        this.hasMore = Array.isArray(events) && events.length === this.count;
        this.page += 1;
      })
      .finally(() => {
        this.isLoading = false;
      });
  }

  @action
  handleInput(inputEvent) {
    const rawValue = inputEvent?.target?.value ?? this.searchInput ?? '';
    const inputValue = rawValue.trim();

    if (!inputValue) {
      this._cancelPendingSearch();
      this.searchResults = [];
      this.invalidSha = false;
      this.searchInput = null;
      this.page = 1;
      this.hasMore = true;
      this.isLoading = false;

      return;
    }

    // Validate SHA
    if (this.searchField === 'sha') {
      const validHex = /^[0-9a-f]{1,40}$/;

      this.invalidSha = !validHex.test(inputValue);

      if (this.invalidSha) {
        this._cancelPendingSearch();
        this.searchResults = [];

        return;
      }
    }

    this.searchInput = inputValue;
    this.page = 1;
    this.hasMore = true;
    this._searchDebounceTimer = debounce(
      this,
      this._executeSearch,
      inputValue,
      this.debounceDelayMs
    );
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
        this._cancelPendingSearch();
        this.searchInput = null;
        this.searchResults = [];
        this.invalidSha = false;
      }
    }
  }

  @action
  loadMore() {
    if (this.isLoading || !this.hasMore) {
      return;
    }

    const inputValue = this.searchInput?.trim();

    if (!inputValue) {
      return;
    }

    if (this.searchField === 'sha' && this.invalidSha) {
      return;
    }

    this._executeSearch(inputValue, { append: true });
  }
}
