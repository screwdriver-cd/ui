import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';

// class Event {
//   @tracked status;
// }

export default class NewPipelineEventsController extends Controller {
  pipelineId;

  // selectedEventId;
  @tracked selectedEventId;

  @tracked events;
  // events;

  get lastSuccessful() {
    const list = this.events || [];
    const event = list.find(e => e.status === 'SUCCESS');

    if (!event) {
      return 0;
    }

    return event.id;
  }
}
