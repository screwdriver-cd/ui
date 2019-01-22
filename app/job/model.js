import EmberObject, { computed } from '@ember/object';
import { equal, match } from '@ember/object/computed';
import DS from 'ember-data';

export default DS.Model.extend({
  pipelineId: DS.attr('string'),
  name: DS.attr('string'),
  isPR: match('name', /^PR-/),
  state: DS.attr('string'),
  stateChanger: DS.attr('string'),
  stateChangeTime: DS.attr('date'),
  stateChangeMessage: DS.attr('string'),
  title: DS.attr('string'),
  username: DS.attr('string'),
  createTime: DS.attr('date'),
  createTimeWords: computed('createTime', {
    get() {
      const duration = Date.now() - +this.get('createTime');

      return `${humanizeDuration(duration, { round: true, largest: 1 })} ago`;
    }
  }),
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
