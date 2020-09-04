import Model, { attr } from '@ember-data/model';

export default class PreferencePipelineModel extends Model {
  @attr('string') pipelineId;

  @attr('number') jobNameLength;
}
