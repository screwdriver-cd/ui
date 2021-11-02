import classic from 'ember-classic-decorator';
import { action } from '@ember/object';
import Route from '@ember/routing/route';

@classic
export default class DetailRoute extends Route {
  routeAfterAuthentication = 'pipeline.build';

  model(params) {
    let selectedArtifact = 'manifest.txt';

    if (params && params.file_path) {
      selectedArtifact = params.file_path;
    }
    this.controllerFor('pipeline.build').set(
      'selectedArtifact',
      selectedArtifact
    );

    // return parent route model
    return this.modelFor('pipeline.build');
  }

  @action
  didTransition() {
    // delegate to its parent route's didTranstion
    return true;
  }
}
