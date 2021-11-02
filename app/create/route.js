import classic from 'ember-classic-decorator';
import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';
import { hash } from 'rsvp';

@classic
export default class CreateRoute extends Route.extend(AuthenticatedRouteMixin) {
  titleToken = 'Create Pipeline';

  routeAfterAuthentication = 'create';

  @service
  shuttle;

  model() {
    return hash({
      templates: this.shuttle.fetchAllTemplates()
    });
  }

  setupController(controller, model) {
    super.setupController(...arguments);
    const trustedTemplates = model.templates.filter(t => t.trusted === true);

    controller.set('templates', trustedTemplates);
  }
}
