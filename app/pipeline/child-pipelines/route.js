import classic from 'ember-classic-decorator';
import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';
import { get } from '@ember/object';

@classic
export default class ChildPipelinesRoute extends Route {
  @service
  session;

  routeAfterAuthentication = 'pipeline.child-pipelines';

  titleToken = 'Child Pipelines';

  model() {
    // Guests should not access this page
    if (get(this, 'session.data.authenticated.isGuest')) {
      this.transitionTo('pipeline');
    }

    const { pipeline } = this.modelFor('pipeline');

    return this.store
      .query('pipeline', {
        configPipelineId: pipeline.id
      })
      .then(pipelines => ({
        pipelines,
        pipeline
      }));
  }
}
