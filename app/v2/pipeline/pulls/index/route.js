import Route from '@ember/routing/route';

export default class V2PipelinePullsIndexRoute extends Route {
  model() {
    return this.modelFor('v2.pipeline.pulls');
  }

  afterModel(model) {
    if (model.newestPrNum) {
      this.replaceWith('v2.pipeline.pulls.show', model.newestPrNum);
    }
  }
}
