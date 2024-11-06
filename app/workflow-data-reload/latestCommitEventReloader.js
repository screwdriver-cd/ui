import DataReloader from './dataReloader';

export default class LatestCommitEventReloader extends DataReloader {
  pipelineId;

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
}
