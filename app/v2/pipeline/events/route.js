import Route from '@ember/routing/route';

export default class NewPipelineEventsRoute extends Route {
  /* eslint-disable camelcase */
  model({ event_id }) {
    return this;
  }
  /* eslint-enable camelcase */
}
