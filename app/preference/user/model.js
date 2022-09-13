import Model, { attr, hasMany } from '@ember-data/model';

export default class PreferenceUserModel extends Model {
  @attr('number') displayJobNameLength;

  @attr('string') timestampFormat;

  @hasMany('preference/pipeline', { async: false }) 'preference/pipelines';
}
