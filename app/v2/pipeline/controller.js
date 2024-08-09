import Controller from '@ember/controller';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';

export default class NewPipelineController extends Controller {
  @service session;

  @service router;

  @tracked isExpanded = false;

  get collections() {
    return this.model.collections;
  }

  get pipeline() {
    return this.model.pipeline;
  }

  get isEventsPullsJobsRoute() {
    const { currentRouteName } = this.router;

    return [
      'v2.pipeline.events.show',
      'v2.pipeline.pulls',
      'v2.pipeline.jobs.index'
    ].includes(currentRouteName);
  }
}
