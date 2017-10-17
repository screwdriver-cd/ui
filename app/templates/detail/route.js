import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';

export default Route.extend({
  template: service(),
  model(params) {
    return this.get('template').getOneTemplate(params.name);
  }
});
