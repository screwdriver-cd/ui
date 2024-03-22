import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';

export default Route.extend(AuthenticatedRouteMixin, {
  template: service(),
  templateName: 'templates/job',

  setupController(controller, model) {
    this._super(controller, model);

    console.log(
      `here`
    );

  },
  async model(params) {

  }
});
