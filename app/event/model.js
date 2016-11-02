import DS from 'ember-data';

export default DS.Model.extend({
  causeMessage: DS.attr('string'),
  commit: DS.attr(),
  createTime: DS.attr('date'),
  creator: DS.attr(),
  pipelineId: DS.attr('string'),
  sha: DS.attr('string'),
  type: DS.attr('string'),
  workflow: DS.attr()
});
