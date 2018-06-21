import DS from 'ember-data';

export default DS.Model.extend({
  pipelineId: DS.attr('number'),
  userId: DS.attr('number'),
  name: DS.attr('string'),
  description: DS.attr('string', { defaultValue: '' }),
  lastUsed: DS.attr('string'),
  value: DS.attr('string'),
  action: DS.attr('string')
});
