import Route from '@ember/routing/route';

export default class NewPipelineEventsShowRoute extends Route {  
  /* eslint-disable camelcase */
  model({ event_id }) {
    return this;
  }
  /* eslint-enable camelcase */
}
