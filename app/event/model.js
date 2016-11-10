import DS from 'ember-data';
import Ember from 'ember';

export default DS.Model.extend({
  builds: DS.hasMany('build'),
  buildsReversed: Ember.computed('builds', {
    get() {
      return this.get('builds').reverseObjects();
    }
  }),
  causeMessage: DS.attr('string'),
  commit: DS.attr(),
  createTime: DS.attr('date'),
  createTimeWords: Ember.computed('createTime', {
    get() {
      const duration = Date.now() - this.get('createTime').getTime();

      return `${humanizeDuration(duration, { round: true, largest: 1 })} ago`;
    }
  }),
  creator: DS.attr(),
  duration: Ember.computed('builds', {
    get() {
      return this.get('builds').reduce((val = 0, item) => val + item.get('totalDurationMS'));
    }
  }),
  durationText: Ember.computed('duration', {
    get() {
      return humanizeDuration(this.get('duration'), { round: true, largest: 1 });
    }
  }),
  pipelineId: DS.attr('string'),
  sha: DS.attr('string'),
  truncatedMessage: Ember.computed('commit.message', {
    get() {
      return this.get('commit.message').split('\n')[0];
    }
  }),
  truncatedSha: Ember.computed('sha', {
    get() {
      return this.get('sha').substr(0, 6);
    }
  }),
  type: DS.attr('string'),
  workflow: DS.attr()
});
