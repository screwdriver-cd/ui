import classic from 'ember-classic-decorator';
import Model, { attr } from '@ember-data/model';

@classic
export default class _Model extends Model {
  @attr('string')
  context;

  @attr('string')
  displayName;

  @attr('string')
  iconType;

  @attr('boolean', { defaultValue: false })
  isSignedIn;

  @attr('boolean', { defaultValue: false })
  autoDeployKeyGeneration;

  @attr('boolean', { defaultValue: false })
  readOnly;
}
