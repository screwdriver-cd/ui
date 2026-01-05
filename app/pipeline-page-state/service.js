import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';

export default class PipelinePageStateService extends Service {
  pipeline;

  childPipelines;

  triggers;

  stages;

  @tracked jobs = [];

  adminUsers;

  isPr;

  route;

  onForceReloadPipelineHeader;

  clear() {
    this.pipeline = null;
    this.childPipelines = [];
    this.triggers = [];
    this.stages = [];
    this.adminUsers = [];
    this.jobs = [];
    this.isPr = false;
    this.route = null;
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

  setAdminUsers(adminUsers) {
    this.adminUsers = adminUsers;
  }

  getAdminUsers() {
    return this.adminUsers;
  }

  setIsPr(isPr) {
    this.isPr = isPr;
  }

  getIsPr() {
    return this.isPr;
  }

  setRoute(route) {
    this.route = route;
  }

  getRoute() {
    return this.route;
  }

  setOnForceReloadPipelineHeader(callback) {
    this.onForceReloadPipelineHeader = callback;
  }

  forceReloadPipelineHeader() {
    if (this.onForceReloadPipelineHeader) {
      this.onForceReloadPipelineHeader();
    }
  }
}
