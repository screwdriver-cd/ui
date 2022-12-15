import DS from 'ember-data';

export default DS.Model.extend({
  name: DS.attr('string'),
  pipelineId: DS.attr('number'),
  description: DS.attr('string'),
  groupEventId: DS.attr('string'),
  jobs: DS.hasMany('job')
});
