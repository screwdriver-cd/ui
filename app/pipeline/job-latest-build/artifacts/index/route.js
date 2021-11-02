import classic from 'ember-classic-decorator';
import Route from '@ember/routing/route';

@classic
export default class IndexRoute extends Route {
  model() {
    // return parent route model
    return this.modelFor('pipeline.job-latest-build');
  }

  afterModel(model) {
    if (!model) return;
    const { id: buildId, pipelineId } = model;

    this.transitionTo('pipeline.build.artifacts.index', pipelineId, buildId);
  }
}
