import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';

export default Route.extend({
  template: service(),
  templateName: 'templates/index',
  model(params) {
    return this.get('template').getAllTemplates(params.namespace);
  }
});
