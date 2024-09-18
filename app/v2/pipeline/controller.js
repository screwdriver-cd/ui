import Controller from '@ember/controller';
import { service } from '@ember/service';

export default class NewPipelineController extends Controller {
  @service session;

  @service router;

  isEventsPullsRoute() {
    const { currentRouteName } = this.router;

    return ['v2.pipeline.events.show', 'v2.pipeline.pulls'].includes(
      currentRouteName
    );
  }

  isJobsRoute() {
    return this.router.currentRouteName === 'v2.pipeline.jobs';
  }

  get routeClasses() {
    if (this.isEventsPullsRoute()) {
      return 'grid events-pulls';
    }
    if (this.isJobsRoute()) {
      return 'grid jobs';
    }

    return null;
  }
}
