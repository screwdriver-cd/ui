import Route from '@ember/routing/route';
import RSVP from 'rsvp';
import { service } from '@ember/service';
import { set } from '@ember/object';

export default class NewPipelineRoute extends Route {
  @service router;

  @service store;

  /* eslint-disable camelcase */
  model({ pipeline_id }) {
    set(this, 'pipelineId', pipeline_id);
    const collections = this.store.findAll('collection').catch(() => []);

    return RSVP.hash({
      pipeline: this.store.findRecord('pipeline', pipeline_id).catch(() => {
        this.router.transitionTo('/404');

        return [];
      }),
      collections
    });
  }
  /* eslint-enable camelcase */
}
