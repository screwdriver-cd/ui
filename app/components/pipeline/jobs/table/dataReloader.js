import ENV from 'screwdriver-ui/config/environment';
import { setBuildStatus } from 'screwdriver-ui/utils/pipeline/build';

export default class DataReloader {
  shuttle;

  pageSize;

  jobIdsMatchingFilter = [];

  jobCallbacks = {};

  builds = {};

  intervalId;

  buildHistory;

  constructor(
    shuttle,
    jobIds,
    pageSize,
    buildHistory = ENV.APP.NUM_BUILDS_LISTED
  ) {
    this.shuttle = shuttle;
    this.jobIdsMatchingFilter = jobIds.slice(0, pageSize);

    jobIds.forEach(jobId => {
      this.builds[jobId] = [];
    });

    this.buildHistory = buildHistory;
  }

  setCorrectBuildStatus(builds) {
    builds.forEach(build => {
      setBuildStatus(build);

      return build;
    });
  }

  updateJobsMatchingFilter(jobIds, pageSize, currentPage) {
    if (jobIds.length < pageSize) {
      this.jobIdsMatchingFilter = jobIds;
    } else {
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;

      this.jobIdsMatchingFilter = jobIds.slice(startIndex, endIndex);
    }
  }

  newJobIds() {
    return this.jobIdsMatchingFilter.filter(
      jobId => this.jobCallbacks[jobId] === undefined
    );
  }

  removeCallbacksForJobId(jobId) {
    delete this.jobCallbacks[jobId];
  }

  addCallbackForJobId(jobId, buildsCallback) {
    if (this.builds[jobId]) {
      buildsCallback(this.builds[jobId]);
    }

    if (!this.jobCallbacks[jobId]) {
      this.jobCallbacks[jobId] = [];
    }

    this.jobCallbacks[jobId].push(buildsCallback);
  }

  // this needs change so it will get the number of history
  async fetchBuildsForJobs(jobIds, count = ENV.APP.NUM_BUILDS_LISTED) {
    if (jobIds.length === 0) {
      return;
    }

    await this.shuttle
      .fetchFromApi(
        'get',
        `/builds/statuses?jobIds=${jobIds.join('&jobIds=')}&numBuilds=${count}`
      )
      .then(response => {
        response.forEach(buildsForJob => {
          this.setCorrectBuildStatus(buildsForJob.builds);

          const { jobId } = buildsForJob;

          this.builds[jobId] = buildsForJob.builds;

          if (this.jobCallbacks[jobId]) {
            this.jobCallbacks[jobId].forEach(callback => {
              callback(buildsForJob.builds);
            });
          }
        });
      });
  }

  start() {
    this.intervalId = setInterval(() => {
      if (Object.keys(this.jobCallbacks).length === 0) {
        return;
      }

      this.fetchBuildsForJobs(
        this.jobIdsMatchingFilter,
        this.buildHistory
      ).then(() => {});
    }, ENV.APP.BUILD_RELOAD_TIMER);
  }

  destroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.intervalId = null;
  }
}
