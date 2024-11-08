import Service, { service } from '@ember/service';
import BuildsDataReloader from './buildsDataReloader';
import LatestCommitEventReloader from './latestCommitEventReloader';

export default class WorkflowDataReloadService extends Service {
  @service shuttle;

  latestCommitEventReloader;

  buildsReloader;

  constructor() {
    super(...arguments);

    this.latestCommitEventReloader = new LatestCommitEventReloader(
      this.shuttle
    );
    this.buildsReloader = new BuildsDataReloader(this.shuttle);
  }

  start(pipelineId) {
    this.stop();

    this.latestCommitEventReloader.setPipelineId(pipelineId);
    this.latestCommitEventReloader.start();
    this.buildsReloader.start();
  }

  stop() {
    this.latestCommitEventReloader.stop();
    this.buildsReloader.stop();
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

  registerLatestCommitEventCallback(queueName, id, callback) {
    this.latestCommitEventReloader.registerCallback(queueName, id, callback);
  }

  removeLatestCommitEventCallback(queueName, id) {
    this.latestCommitEventReloader.removeCallback(queueName, id);
  }
}
