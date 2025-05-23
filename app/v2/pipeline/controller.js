import Controller from '@ember/controller';
import { service } from '@ember/service';

export default class NewPipelineController extends Controller {
  @service router;

  isEventsPullsRoute() {
    const { currentRouteName } = this.router;

    return (
      currentRouteName.startsWith('v2.pipeline.events') ||
      currentRouteName.startsWith('v2.pipeline.pulls')
    );
  }

  isJobsRoute() {
    return this.router.currentRouteName === 'v2.pipeline.jobs';
  }

  get routeClasses() {
    if (this.isEventsPullsRoute()) {
      return 'events-pulls';
    }
    if (this.isJobsRoute()) {
      return 'jobs';
    }

    return null;
  }
}
