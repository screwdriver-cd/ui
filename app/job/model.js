import EmberObject, { computed } from '@ember/object';
import { equal } from '@ember/object/computed';
import DS from 'ember-data';

export default DS.Model.extend({
  pipelineId: DS.attr('string'),
  name: DS.attr('string'),
  state: DS.attr('string'),
  permutations: DS.attr(),
  builds: DS.hasMany('build', { async: true }),
  isDisabled: equal('state', 'DISABLED'),
  lastBuild: computed('builds', {
    get() {
      const builds = this.get('builds');

      if (builds.length === 0) {
        return EmberObject.create();
      }

      return builds.objectAt(0);
    }
  })
});
