import Service from '@ember/service';

export default class PipelinePageStateService extends Service {
  pipeline;

  clear() {
    this.pipeline = null;
  }

  setPipeline(pipeline) {
    this.pipeline = pipeline;
  }

  getPipeline() {
    return this.pipeline;
  }

  getPipelineId() {
    return this.pipeline.id;
  }
}
