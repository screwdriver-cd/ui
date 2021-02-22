import Model, { attr } from '@ember-data/model';

export default class PreferencePipelineModel extends Model {
  @attr('string') pipelineId;

  @attr('number', { defaultValue: 20 }) jobNameLength;

  @attr('boolean', { defaultValue: true }) showPRJobs;
}
