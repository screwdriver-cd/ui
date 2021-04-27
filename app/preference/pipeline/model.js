import Model, { attr } from '@ember-data/model';

export default class PreferencePipelineModel extends Model {
  @attr('number', { defaultValue: 20 }) displayJobNameLength;

  @attr('boolean', { defaultValue: true }) showPRJobs;
}
