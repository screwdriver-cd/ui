import classic from 'ember-classic-decorator';
import Model, { attr } from '@ember-data/model';

@classic
export default class _Model extends Model {
  @attr('string')
  pipelineId;

  @attr('date')
  createTime;

  @attr('string')
  causeMessage;

  @attr('string')
  sha;

  @attr('number')
  queuedTime;

  @attr('number')
  imagePullTime;

  @attr('number')
  duration;

  @attr('string', { defaultValue: 'UNKNOWN' })
  status;

  @attr()
  builds;

  @attr()
  commit;

  @attr('number')
  jobId;

  @attr('number')
  eventId;

  @attr()
  steps;
}
