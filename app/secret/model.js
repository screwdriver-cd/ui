import Model, { attr } from '@ember-data/model';

export default Model.extend({
  pipelineId: attr('string'), // DS.belongsTo('pipeline'),
  name: attr('string'),
  value: attr('string'),
  allowInPR: attr('boolean', { defaultValue: false })
});
