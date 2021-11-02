import classic from 'ember-classic-decorator';
import Model, { attr } from '@ember-data/model';

@classic
export default class _Model extends Model {
  @attr('string')
  pipelineId; // DS.belongsTo('pipeline'),

  @attr('string')
  name;

  @attr('string')
  value;

  @attr('boolean', { defaultValue: false })
  allowInPR;
}
