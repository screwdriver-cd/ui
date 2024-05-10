import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';

export default class NewPipelineEventsController extends Controller {
  @tracked selectedEventId;
}
