import DataReloader from './dataReloader';

const CACHE_KEY = 'latestCommitEvent';

export default class LatestCommitEventReloader extends DataReloader {
  constructor(shuttle) {
    super(shuttle, CACHE_KEY);
  }

  async fetchDataForId() {
    return this.shuttle
      .getLatestCommitEvent(this.pipelineId)
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
