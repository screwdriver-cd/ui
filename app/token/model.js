import Model, { attr } from '@ember-data/model';

export default Model.extend({
  pipelineId: attr('number'),
  userId: attr('number'),
  name: attr('string'),
  description: attr('string', { defaultValue: '' }),
  lastUsed: attr('string'),
  value: attr('string'),
  action: attr('string')
});
