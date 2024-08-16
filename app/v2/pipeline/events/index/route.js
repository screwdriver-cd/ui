import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class NewPipelineEventsIndexRoute extends Route {
  @service router;

  redirect(model) {
    this.router.replaceWith(
      'v2.pipeline.events.show',
      model.latestCommitEvent.id
    );
  }
}
