import classic from 'ember-classic-decorator';
import Model, { attr } from '@ember-data/model';

@classic
export default class _Model extends Model {
  @attr('string')
  name;

  @attr('string')
  description;

  @attr('string')
  type;

  @attr()
  pipelineIds;

  @attr()
  pipelines;
}
