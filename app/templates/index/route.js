import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';

export default Route.extend({
  template: service(),
  model() {
    return this.template.getAllTemplates();
  }
});
