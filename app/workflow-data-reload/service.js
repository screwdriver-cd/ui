import Service, { service } from '@ember/service';
import BuildsDataReloader from './buildsDataReloader';
import StageBuildsDataReloader from './stageBuildsDataReloader';
import LatestCommitEventReloader from './latestCommitEventReloader';
import OpenPrsReloader from './openPrsReloader';

export default class WorkflowDataReloadService extends Service {
  @service shuttle;

  latestCommitEventReloader;

  buildsReloader;

  stageBuildsReloader;

  openPrsReloader;

  requiresLatestCommitEvent;

  id;

  ids;

  constructor() {
    super(...arguments);

    this.latestCommitEventReloader = new LatestCommitEventReloader(
      this.shuttle
    );
    this.buildsReloader = new BuildsDataReloader(this.shuttle);
    this.stageBuildsReloader = new StageBuildsDataReloader(this.shuttle);
    this.openPrsReloader = new OpenPrsReloader(this.shuttle);

    this.id = 0;
    this.ids = new Set();
  }

  start(pipelineId, isPR) {
    this.stop(this.id);
    this.id += 1;
    this.ids.add(this.id);

    if (!isPR) {
      this.requiresLatestCommitEvent = true;
      this.latestCommitEventReloader.setPipelineId(pipelineId);
      this.latestCommitEventReloader.start();
    } else {
      this.requiresLatestCommitEvent = false;
      this.openPrsReloader.setPipelineId(pipelineId);
      this.openPrsReloader.start();
    }

    this.buildsReloader.start();
    this.stageBuildsReloader.start();

    return this.id;
  }

  stop(id) {
    if (this.ids.has(id)) {
      this.ids.delete(id);

      this.latestCommitEventReloader.stop();
      this.openPrsReloader.stop();
      this.buildsReloader.stop();
      this.stageBuildsReloader.stop();
    }
  }

  getBuildsForEvent(eventId) {
    return this.buildsReloader.getBuildsForEvent(eventId);
  }

  registerBuildsCallback(queueName, id, callback) {
    this.buildsReloader.registerCallback(queueName, id, callback);
  }

  removeBuildsCallback(queueName, id) {
    this.buildsReloader.removeCallback(queueName, id);
  }

  getStageBuildsForEvent(eventId) {
    return this.stageBuildsReloader.getStageBuildsForEvent(eventId);
  }

  registerStageBuildsCallback(queueName, id, callback) {
    this.stageBuildsReloader.registerCallback(queueName, id, callback);
  }

  removeStageBuildsCallback(queueName, id) {
    this.stageBuildsReloader.removeCallback(queueName, id);
  }

  registerLatestCommitEventCallback(queueName, id, callback) {
    if (this.requiresLatestCommitEvent) {
      this.latestCommitEventReloader.registerCallback(queueName, id, callback);
    }
  }

  removeLatestCommitEventCallback(queueName, id) {
    this.latestCommitEventReloader.removeCallback(queueName, id);
  }

  getLatestCommitEvent() {
    return this.latestCommitEventReloader.getLatestCommitEvent();
  }

  registerOpenPrsCallback(queueName, id, callback) {
    this.openPrsReloader.registerCallback(queueName, id, callback);
  }

  removeOpenPrsCallback(queueName, id) {
    this.openPrsReloader.removeCallback(queueName, id);
  }

  getPrNums() {
    return this.openPrsReloader.getPrNums();
  }

  getJobsForPr(prNum) {
    return this.openPrsReloader.getJobsForPr(prNum);
  }
}
