import DS from 'ember-data';

export default DS.Model.extend({
  context: DS.attr('string'),
  displayName: DS.attr('string'),
  iconType: DS.attr('string'),
  isSignedIn: DS.attr('boolean', { defaultValue: false })
});
