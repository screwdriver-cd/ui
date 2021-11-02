import classic from 'ember-classic-decorator';
import Route from '@ember/routing/route';

@classic
export default class ArtifactsRoute extends Route {
  model() {
    // return parent route model
    return this.modelFor('pipeline.job-latest-build');
  }
}
