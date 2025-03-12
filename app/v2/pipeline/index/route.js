import Route from '@ember/routing/route';

export default class NewPipelineIndexRoute extends Route {
  beforeModel() {
    this.replaceWith('v2.pipeline.events');
  }
}
