import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';

export default Route.extend({
  router: service(),
  model() {
    return this.modelFor('templates.detail');
  }
});
