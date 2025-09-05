import RSVP from 'rsvp';
import Route from '@ember/routing/route';
import { set } from '@ember/object';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';
import { inject as service } from '@ember/service';
import { NotFoundError } from '../utils/not-found-error';

export default Route.extend(AuthenticatedRouteMixin, {
  routeAfterAuthentication: 'pipeline',
  store: service(),
  shuttle: service(),
  banners: service(),
  router: service(),
  model(params) {
    set(this, 'pipelineId', params.pipeline_id);
    const collections = this.store.findAll('collection').catch(() => []);

    this.banners.getGlobalBanners().then(async () => {
      await this.banners.getPipelineBanners(params.pipeline_id);
    });

    return RSVP.hash({
      pipeline: this.store.findRecord('pipeline', params.pipeline_id),
      collections
    }).catch(() => {
      throw new NotFoundError('Pipeline not found');
    });
  },
  deactivate() {
    this.banners.getGlobalBanners().then(() => {});
  },
  actions: {
    error(error) {
      if (
        error &&
        Array.isArray(error.errors) &&
        error.errors[0].status === 404
      ) {
        if (error.errors[0].detail === 'Build does not exist') {
          const pipelineEventsController =
            this.controllerFor('pipeline.events');

          pipelineEventsController.set('errorMessage', 'Build does not exist');
          this.router.transitionTo('pipeline.index');

          return false;
        }
      }

      return true;
    }
  }
});
