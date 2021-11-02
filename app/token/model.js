import classic from 'ember-classic-decorator';
import Model, { attr } from '@ember-data/model';

@classic
export default class _Model extends Model {
  @attr('number')
  pipelineId;

  @attr('number')
  userId;

  @attr('string')
  name;

  @attr('string', { defaultValue: '' })
  description;

  @attr('string')
  lastUsed;

  @attr('string')
  value;

  @attr('string')
  action;
}
