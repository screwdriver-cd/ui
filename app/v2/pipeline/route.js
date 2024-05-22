import Route from '@ember/routing/route';
import RSVP from 'rsvp';
import { service } from '@ember/service';

export default class NewPipelineRoute extends Route {
  @service router;

  @service store;

  /* eslint-disable camelcase */
  model({ pipeline_id }) {
    return RSVP.hash({
      pipeline: this.store.findRecord('pipeline', pipeline_id).catch(err => {
        console.log('err', err);
        // throw err;
        this.router.transitionTo('/404');

        return [];
      })
    });
  }
  /* eslint-enable camelcase */
}
