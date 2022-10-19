import Model, { attr, hasMany } from '@ember-data/model';

export default Model.extend({
  name: attr('string'),
  description: attr('string'),
  type: attr('string'),
  pipelineIds: attr(),
  pipelines: hasMany('pipeline', { sync: true })
});
