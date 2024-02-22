import Model, { attr } from '@ember-data/model';

export default Model.extend({
  name: attr('string'),
  pipelineId: attr('number'),
  description: attr('string'),
  jobIds: attr(),
  setup: attr('number'),
  teardown: attr('number')
});
