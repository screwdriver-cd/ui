import Route from '@ember/routing/route';

export default class NewPipelineIndexRoute extends Route {
  /* eslint-disable camelcase */
  model({ pipeline_id }) {
    return this;
  }
  /* eslint-enable camelcase */
}
