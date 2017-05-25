import DS from 'ember-data';
import Ember from 'ember';

export default DS.Model.extend({
  builds: DS.hasMany('build'),
  buildsSorted: Ember.computed.sort('builds', (a, b) => parseInt(a.id, 10) - parseInt(b.id, 10)),
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
  duration: Ember.computed('builds.[]', 'isComplete', {
    get() {
      return this.get('builds').reduce((val = 0, item) => val + item.get('totalDurationMS'));
    }
  }),
  durationText: Ember.computed('duration', {
    get() {
      return humanizeDuration(this.get('duration'), { round: true, largest: 1 });
    }
  }),
  isComplete: Ember.computed('builds.[]', 'builds.lastObject.status', {
    get() {
      const builds = this.get('builds');
      const numBuilds = builds.get('length');

      // No builds in this event yet
      if (!numBuilds) {
        return false;
      }

      const lastBuild = builds.get('lastObject');
      const expectedBuilds = this.get('workflow').length;
      const status = lastBuild.get('status');

      // last build is still running
      if (status === 'RUNNING' || status === 'QUEUED') {
        return false;
      }

      // last build was successful, but there should be more builds in the event
      if (status === 'SUCCESS' && expectedBuilds !== numBuilds) {
        return false;
      }

      // last build failed, or all expected builds are successful
      return true;
    }
  }),
  isRunning: Ember.computed.not('isComplete'),
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
