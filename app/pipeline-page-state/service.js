import Service from '@ember/service';

export default class PipelinePageStateService extends Service {
  pipeline;

  childPipelines;

  triggers;

  stages;

  jobs;

  isPr;

  clear() {
    this.pipeline = null;
    this.childPipelines = [];
    this.triggers = [];
    this.stages = [];
    this.jobs = [];
    this.isPr = false;
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

  setTriggers(triggers) {
    this.triggers = triggers;
  }

  getTriggers() {
    return this.triggers;
  }

  setStages(stages) {
    this.stages = stages;
  }

  getStages() {
    return this.stages;
  }

  setJobs(jobs) {
    this.jobs = jobs;
  }

  getJobs() {
    return this.jobs;
  }

  setIsPr(isPr) {
    this.isPr = isPr;
  }

  getIsPr() {
    return this.isPr;
  }
}
