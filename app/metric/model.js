import Model, { attr } from '@ember-data/model';

export default Model.extend({
  pipelineId: attr('string'),
  createTime: attr('date'),
  causeMessage: attr('string'),
  sha: attr('string'),
  queuedTime: attr('number'),
  imagePullTime: attr('number'),
  duration: attr('number'),
  status: attr('string', { defaultValue: 'UNKNOWN' }),
  builds: attr(),
  commit: attr(),
  jobId: attr('number'),
  eventId: attr('number'),
  steps: attr()
});
