import ENV from 'screwdriver-ui/config/environment';
import { setBuildStatus } from 'screwdriver-ui/utils/pipeline/build';

const QUEUE_NAME = 'jobs-table-data-reloader';

export default class DataReloader {
  shuttle;

  workflowDataReload;

  jobIds = [];

  intervalId;

  numBuilds;

  buildsCallback;

  constructor(apiFetchers, jobIds, pageSize, numBuilds, buildsCallback) {
    const { shuttle, workflowDataReload } = apiFetchers;

    this.shuttle = shuttle;
    this.workflowDataReload = workflowDataReload;
    this.jobIds = jobIds.slice(0, pageSize);
    this.numBuilds = numBuilds || ENV.APP.NUM_BUILDS_LISTED;
    this.buildsCallback = buildsCallback;
  }

  setCorrectBuildStatus(builds) {
    builds.forEach(build => {
      setBuildStatus(build);

      return build;
    });
  }

  updateJobsMatchingFilter(jobIds, pageSize, currentPage) {
    if (jobIds.length < pageSize) {
      this.jobIds = jobIds;
    } else {
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;

      this.jobIds = jobIds.slice(startIndex, endIndex);
    }
  }

  async fetchBuildsForJobs() {
    if (this.jobIds.length === 0) {
      return;
    }

    await this.shuttle
      .fetchFromApi(
        'get',
        `/builds/statuses?jobIds=${this.jobIds.join('&jobIds=')}&numBuilds=${
          this.numBuilds
        }`
      )
      .then(response => {
        const buildsMap = new Map();

        response.forEach(buildsForJob => {
          this.setCorrectBuildStatus(buildsForJob.builds);
          buildsMap.set(buildsForJob.jobId, buildsForJob.builds);
        });

        this.buildsCallback(buildsMap);
      });
  }

  async setNumBuilds(numBuilds) {
    if (this.numBuilds === numBuilds) {
      return;
    }
    this.numBuilds = numBuilds;
    await this.fetchBuildsForJobs();
  }

  start(eventId) {
    if (eventId) {
      this.workflowDataReload.registerBuildsCallback(
        QUEUE_NAME,
        eventId,
        builds => {
          this.buildsCallback(builds);
        }
      );

      return;
    }

    this.intervalId = setInterval(() => {
      this.fetchBuildsForJobs().then(() => {});
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
}
