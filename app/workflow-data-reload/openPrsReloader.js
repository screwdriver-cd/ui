import {
  getPrJobsMap,
  getPrNumbers
} from 'screwdriver-ui/utils/pipeline/pull-request';
import DataReloader from './dataReloader';

const CACHE_KEY = 'openPrNums';

export default class OpenPrsReloader extends DataReloader {
  prJobsCache;

  constructor(shuttle) {
    super(shuttle, CACHE_KEY);

    this.prJobsCache = new Map();
  }

  async fetchDataForId() {
    return this.shuttle
      .fetchFromApi('get', `/pipelines/${this.pipelineId}/jobs?type=pr`)
      .then(prJobs => {
        this.prJobsCache = getPrJobsMap(prJobs);

        return Array.from(getPrNumbers(prJobs)).sort((a, b) => a - b);
      });
  }

  getPrNums() {
    return this.responseCache.get(CACHE_KEY);
  }

  getJobsForPr(prNum) {
    return this.prJobsCache.get(prNum);
  }
}
