import ENV from 'screwdriver-ui/config/environment';
import { setBuildStatus } from 'screwdriver-ui/utils/pipeline/build';

const QUEUE_NAME = 'jobs-table-data-reloader';

export default class DataReloader {
  shuttle;

  workflowDataReload;

  pageSize;

  jobIdsMatchingFilter = [];

  jobCallbacks = {};

  builds = {};

  intervalId;

  numBuilds;

  constructor(apiFetchers, jobIds, pageSize, numBuilds) {
    const { shuttle, workflowDataReload } = apiFetchers;

    this.shuttle = shuttle;
    this.workflowDataReload = workflowDataReload;
    this.jobIdsMatchingFilter = jobIds.slice(0, pageSize);

    jobIds.forEach(jobId => {
      this.builds[jobId] = [];
    });

    this.numBuilds = numBuilds || ENV.APP.NUM_BUILDS_LISTED;
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

  sendBuildsToCallbacks(jobId, builds) {
    if (this.jobCallbacks[jobId]) {
      this.jobCallbacks[jobId].forEach(callback => {
        callback(builds);
      });
    }
  }

  async fetchBuildsForJobs(jobIds) {
    if (jobIds.length === 0) {
      return;
    }

    await this.shuttle
      .fetchFromApi(
        'get',
        `/builds/statuses?jobIds=${jobIds.join('&jobIds=')}&numBuilds=${
          this.numBuilds
        }`
      )
      .then(response => {
        response.forEach(buildsForJob => {
          this.setCorrectBuildStatus(buildsForJob.builds);

          const { jobId } = buildsForJob;

          this.builds[jobId] = buildsForJob.builds;
          this.sendBuildsToCallbacks(jobId, buildsForJob.builds);
        });
      });
  }

  async setNumBuilds(numBuilds) {
    if (this.numBuilds === numBuilds) {
      return;
    }
    this.numBuilds = numBuilds;
    await this.fetchBuildsForJobs(this.jobIdsMatchingFilter);
  }

  start(eventId) {
    if (eventId) {
      this.workflowDataReload.registerBuildsCallback(
        QUEUE_NAME,
        eventId,
        builds => {
          this.parseEventBuilds(builds);
        }
      );

      return;
    }

    this.intervalId = setInterval(() => {
      if (Object.keys(this.jobCallbacks).length === 0) {
        return;
      }

      this.fetchBuildsForJobs(this.jobIdsMatchingFilter).then(() => {});
    }, ENV.APP.BUILD_RELOAD_TIMER);
  }

  stop(eventId) {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    if (eventId) {
      this.workflowDataReload.removeBuildsCallback(QUEUE_NAME, eventId);
    }

    this.intervalId = null;
  }

  parseEventBuilds(eventBuilds) {
    eventBuilds.forEach(eventBuild => {
      const { jobId } = eventBuild;
      const builds = [eventBuild];

      this.builds[jobId] = builds;
      this.sendBuildsToCallbacks(jobId, builds);
    });
  }
}