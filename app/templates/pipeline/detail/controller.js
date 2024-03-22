import Controller from '@ember/controller';
import { service } from '@ember/service';
import { action } from '@ember/object';

export default class TemplatesPipelineDetailController extends Controller {
  @service store;

  constructor() {
    super(...arguments);
  }

  @action
  removeVersion() {

  }

  @action
  timeRangeChange() {

  }

}
