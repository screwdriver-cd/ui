import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';
import { hash } from 'rsvp';

export default Route.extend(AuthenticatedRouteMixin, {
  titleToken: 'Create Pipeline',
  routeAfterAuthentication: 'create',
  shuttle: service(),

  model() {
    return hash({
      templates: this.shuttle.fetchAllTemplates()
    });
  },

  setupController(controller, model) {
    this._super(...arguments);
    const trustedTemplates = model.templates.filter(t => t.trusted === true);

    controller.set('templates', trustedTemplates);
  }
});
