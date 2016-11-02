import DS from 'ember-data';
import Ember from 'ember';

export default DS.Model.extend({
  eventId: DS.attr('string'),
  jobId: DS.attr('string'),
  parentBuildId: DS.attr('string'),
  number: DS.attr('number'),
  // ember-data has some reservations with the "container" attribute name
  buildContainer: DS.attr('string'),
  cause: DS.attr('string'),
  sha: DS.attr('string'),
  createTime: DS.attr('date'),
  startTime: DS.attr('date'),
  endTime: DS.attr('date'),
  queuedDuration: Ember.computed('createTime', 'startTime', {
    get() {
      if (!this.get('startTime')) {
        return humanizeDuration(0);
      }

      const duration = this.get('startTime').getTime() - this.get('createTime').getTime();

      return humanizeDuration(duration, { round: true, largest: 1 });
    }
  }),
  buildDuration: Ember.computed('startTime', 'endTime', {
    get() {
      if (!this.get('endTime') || !this.get('startTime')) {
        return humanizeDuration(0);
      }

      const duration = this.get('endTime').getTime() - this.get('startTime').getTime();

      return humanizeDuration(duration, { round: true, largest: 1 });
    }
  }),
  createTimeWords: Ember.computed('createTime', {
    get() {
      const duration = Date.now() - this.get('createTime').getTime();

      return `${humanizeDuration(duration, { round: true, largest: 1 })} ago`;
    }
  }),
  parameters: DS.attr(),
  meta: DS.attr(),
  steps: DS.attr(),
  status: DS.attr('string'),
  commit: DS.attr()
});
