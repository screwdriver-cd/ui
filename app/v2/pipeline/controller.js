import Controller from '@ember/controller';
import { service } from '@ember/service';

export default class NewPipelineController extends Controller {
  @service session;

  @service router;

  get isEventsPullsJobsRoute() {
    const { currentRouteName } = this.router;

    return [
      'v2.pipeline.events.show',
      'v2.pipeline.pulls',
      'v2.pipeline.jobs.index'
    ].includes(currentRouteName);
  }
}
