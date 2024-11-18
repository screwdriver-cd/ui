import DataReloader from './dataReloader';

const CACHE_KEY = 'latestCommitEvent';

export default class LatestCommitEventReloader extends DataReloader {
  pipelineId;

  constructor(shuttle) {
    super(shuttle, CACHE_KEY);
  }

  setPipelineId(pipelineId) {
    this.pipelineId = pipelineId;
  }

  async fetchDataForId() {
    return this.shuttle
      .fetchFromApi('get', `/pipelines/${this.pipelineId}/latestCommitEvent`)
      .then(latestCommitEvent => {
        return latestCommitEvent;
      })
      .catch(() => {
        return null;
      });
  }

  getLatestCommitEvent() {
    return this.responseCache.get(CACHE_KEY);
  }
}
