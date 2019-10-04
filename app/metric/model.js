import DS from 'ember-data';

export default DS.Model.extend({
  pipelineId: DS.attr('string'),
  createTime: DS.attr('date'),
  causeMessage: DS.attr('string'),
  sha: DS.attr('string'),
  queuedTime: DS.attr('number'),
  imagePullTime: DS.attr('number'),
  duration: DS.attr('number'),
  status: DS.attr('string', { defaultValue: 'UNKNOWN' }),
  builds: DS.attr(),
  url: DS.attr('string'),
  jobId: DS.attr('number'),
  eventId: DS.attr('number'),
  steps: DS.attr()
});
