import DS from 'ember-data';

export default DS.Model.extend({
  pipelineId: DS.attr('string'), // DS.belongsTo('pipeline'),
  name: DS.attr('string'),
  value: DS.attr('string'),
  allowInPR: DS.attr('boolean', { defaultValue: false })
});
