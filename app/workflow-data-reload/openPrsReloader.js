import { getPrNumbers } from 'screwdriver-ui/utils/pipeline/pull-request';
import DataReloader from './dataReloader';

const CACHE_KEY = 'openPrNums';

export default class OpenPrsReloader extends DataReloader {
  constructor(shuttle) {
    super(shuttle, CACHE_KEY);
  }

  async fetchDataForId() {
    return this.shuttle
      .fetchFromApi('get', `/pipelines/${this.pipelineId}/jobs?type=pr`)
      .then(prJobs => {
        return Array.from(getPrNumbers(prJobs)).sort((a, b) => a - b);
      });
  }

  getPrNums() {
    return this.responseCache.get(CACHE_KEY);
  }
}
