import Model, { attr, hasMany } from '@ember-data/model';

export default Model.extend({
  name: attr('string'),
  pipelineId: attr('number'),
  description: attr('string'),
  jobs: hasMany('job')
});
