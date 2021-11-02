import classic from 'ember-classic-decorator';
import Route from '@ember/routing/route';

@classic
export default class IndexRoute extends Route {
  routeAfterAuthentication = 'pipeline';

  beforeModel() {
    const { pipeline } = this.modelFor('pipeline');

    if (pipeline.get('childPipelines')) {
      this.transitionTo('pipeline.child-pipelines');
    } else {
      this.transitionTo('pipeline.events');
    }
  }
}
