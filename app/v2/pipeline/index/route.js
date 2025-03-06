import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class NewPipelineIndexRoute extends Route {
  @service router;

  beforeModel() {
    this.router.replaceWith('v2.pipeline.events');
  }
}
