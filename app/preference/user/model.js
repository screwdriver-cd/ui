import Model, { attr, hasMany } from '@ember-data/model';
import {
  TIMESTAMP_DEFAULT_OPTION,
  TIMESTAMP_OPTIONS
} from '../../utils/timestamp-format';

export default class PreferenceUserModel extends Model {
  @attr('number') displayJobNameLength;

  @attr('string', {
    defaultValue: TIMESTAMP_OPTIONS[TIMESTAMP_DEFAULT_OPTION].value
  })
  timestampFormat;

  @attr('boolean') allowNotification;

  @hasMany('preference/pipeline', { async: false }) 'preference/pipelines';
}
