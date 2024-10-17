import Service, { service } from '@ember/service';
import { setBuildStatus } from 'screwdriver-ui/utils/pipeline/build';
import ENV from 'screwdriver-ui/config/environment';

export default class WorkflowDataReloadService extends Service {
  @service shuttle;

  intervalId;

  pipelineId;

  latestCommitResponse;

  buildsCache;

  callbacks;

  queueNames;

  eventIdSet;

  eventIdCounts;

  constructor() {
    super(...arguments);

    this.latestCommitResponse = null;
    this.buildsCache = new Map();
    this.callbacks = new Map();
    this.queueNames = new Set();
    this.eventIdSet = new Set();
    this.eventIdCounts = new Map();
  }

  start(pipelineId) {
    this.pipelineId = pipelineId;

    this.stop();
    this.fetchData().then(() => {});

    this.intervalId = setInterval(
      () => this.fetchData().then(() => {}),
      ENV.APP.BUILD_RELOAD_TIMER
    );
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);

      this.intervalId = null;
      this.pipelineId = null;
      this.latestCommitResponse = null;
      this.buildsCache.clear();
      this.callbacks.clear();
      this.queueNames.clear();
      this.eventIdSet.clear();
      this.eventIdCounts.clear();
    }
  }

  async fetchData() {
    return this.shuttle
      .fetchFromApi('get', `/pipelines/${this.pipelineId}/latestCommitEvent`)
      .then(latestCommitEvent => {
        this.latestCommitResponse = latestCommitEvent;
        this.fetchBuilds();
      });
  }

  async fetchBuildDataForEvent(eventId) {
    return this.shuttle
      .fetchFromApi('get', `/events/${eventId}/builds?fetchSteps=false`)
      .then(builds => {
        setBuildStatus(builds);
        this.buildsCache.set(eventId, builds);

        this.queueNames.forEach(queueName => {
          if (this.callbacks.get(queueName).has(eventId)) {
            this.callbacks.get(queueName).get(eventId)(
              builds,
              this.latestCommitResponse
            );
          }
        });
      });
  }

  async fetchBuilds() {
    this.eventIdSet.forEach(eventId => {
      this.fetchBuildDataForEvent(eventId);
    });
  }

  getLatestCommitEventId() {
    return this.latestCommitResponse?.id;
  }

  registerCallback(queueName, eventId, callback) {
    if (!this.callbacks.has(queueName)) {
      this.callbacks.set(queueName, new Map());
      this.queueNames.add(queueName);
    }

    this.callbacks.get(queueName).set(eventId, callback);

    this.eventIdSet.add(eventId);

    if (this.eventIdCounts.has(eventId)) {
      this.eventIdCounts.set(eventId, this.eventIdCounts.get(eventId) + 1);
    } else {
      this.eventIdCounts.set(eventId, 1);
    }

    if (this.buildsCache.has(eventId)) {
      callback(this.buildsCache.get(eventId));
    } else {
      this.fetchBuildDataForEvent(eventId).then(() => {});
    }
  }

  removeCallback(queueName, eventId) {
    if (this.callbacks.has(queueName)) {
      const deleted = this.callbacks.get(queueName).delete(eventId);

      if (deleted) {
        if (this.callbacks.get(queueName).size === 0) {
          this.callbacks.delete(queueName);
          this.queueNames.delete(queueName);
        }

        if (this.eventIdCounts.get(eventId) === 1) {
          this.eventIdCounts.delete(eventId);
          this.eventIdSet.delete(eventId);
          this.buildsCache.delete(eventId);
        } else {
          this.eventIdCounts.set(eventId, this.eventIdCounts.get(eventId) - 1);
        }
      }
    }
  }
}
