import classic from 'ember-classic-decorator';
import RSVP from 'rsvp';
import Route from '@ember/routing/route';
import { get, set, action } from '@ember/object';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';

@classic
export default class PipelineRoute extends Route.extend(
  AuthenticatedRouteMixin
) {
  routeAfterAuthentication = 'pipeline';

  model(params) {
    set(this, 'pipelineId', params.pipeline_id);

    const collections = this.store.findAll('collection').catch(() => []);

    return RSVP.hash({
      pipeline: this.store
        .findRecord('pipeline', params.pipeline_id)
        .catch(() => {
          this.transitionTo('/404');

          return [];
        }),
      collections
    });
  }

  @action
  error(error) {
    if (
      error &&
      Array.isArray(error.errors) &&
      error.errors[0].status === 404
    ) {
      this.transitionTo('/404');
    }

    return true;
  }

  titleToken(model) {
    return get(model, 'pipeline.name');
  }
}
