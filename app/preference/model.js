import Model, { attr, hasMany } from '@ember-data/model';

export default class PreferenceModel extends Model {
  @attr('string') name;

  @hasMany('pipeline', { async: true, dependent: 'destroy' }) pipelines;
}
