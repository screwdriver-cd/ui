import Service from '@ember/service';

export default class PipelinePageStateService extends Service {
  pipeline;

  childPipelines;

  clear() {
    this.pipeline = null;
    this.childPipelines = [];
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

  setChildPipelines(pipelines) {
    this.childPipelines = pipelines;
  }

  getChildPipelines() {
    return this.childPipelines;
  }
}
