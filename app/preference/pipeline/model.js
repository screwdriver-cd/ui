import Model, { attr } from '@ember-data/model';

export default class PreferencePipelineModel extends Model {
  @attr('boolean', { defaultValue: true }) showPRJobs;
}
