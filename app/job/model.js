import DS from 'ember-data';
import Ember from 'ember';

export default DS.Model.extend({
  pipelineId: DS.attr('string'),
  name: DS.attr('string'),
  state: DS.attr('string'),
  permutations: DS.attr(),
  builds: DS.hasMany('build', { async: true }),
  isDisabled: Ember.computed.equal('state', 'DISABLED'),
  lastBuild: Ember.computed('builds', {
    get() {
      const builds = this.get('builds');

      if (builds.length === 0) {
        return Ember.Object.create();
      }

      return builds.objectAt(0);
    }
  })
});
