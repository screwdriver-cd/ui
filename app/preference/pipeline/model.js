import Model, { attr, belongsTo } from '@ember-data/model';

export default class PreferencePipelineModel extends Model {
  @attr('number') pipelineId;

  @attr('number') displayNameLength;

  @belongsTo('preference', { async: true, autoSave: true }) preference;
}
