import classic from 'ember-classic-decorator';
import { action } from '@ember/object';
import Route from '@ember/routing/route';

@classic
export default class ArtifactsRoute extends Route {
  routeAfterAuthentication = 'pipeline.build';

  model() {
    // return parent route model
    return this.modelFor('pipeline.build');
  }

  @action
  didTransition() {
    this.controllerFor('pipeline.build').set('activeTab', 'artifacts');
  }
}
