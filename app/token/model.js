import Model, { attr } from '@ember-data/model';

export default Model.extend({
  pipelineId: attr('number'),
  userId: attr('number'),
  name: attr('string'),
  description: attr('string', { defaultValue: '' }),
  lastUsed: attr('string'),
  expiresAt: attr('string'),
  issuerId: attr('string'),
  options: attr({
    defaultValue() {
      return {
        permission: '',
        resources: {}
      };
    }
  }),
  value: attr('string'),
  action: attr('string')
});
