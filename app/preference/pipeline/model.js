import Model, { attr } from '@ember-data/model';

export default class PreferencePipelineModel extends Model {
  @attr('number') pipelineId;

  @attr('number') jobNameLength;
}
