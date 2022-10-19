import Model, { attr } from '@ember-data/model';

export default Model.extend({
  context: attr('string'),
  displayName: attr('string'),
  iconType: attr('string'),
  isSignedIn: attr('boolean', { defaultValue: false }),
  autoDeployKeyGeneration: attr('boolean', { defaultValue: false }),
  readOnly: attr('boolean', { defaultValue: false })
});
