import classic from 'ember-classic-decorator';
import Route from '@ember/routing/route';

@classic
export default class DetailRoute extends Route {
  model() {
    // return parent route model
    return this.modelFor('pipeline.job-latest-build');
  }

  afterModel(model) {
    if (!model) return;
    const { id: buildId, pipelineId } = model;
    const filePath = this.paramsFor(this.routeName).file_path;

    this.transitionTo(
      'pipeline.build.artifacts.detail',
      pipelineId,
      buildId,
      filePath
    );
  }
}
