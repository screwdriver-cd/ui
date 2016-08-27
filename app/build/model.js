import DS from 'ember-data';
import Ember from 'ember';

export default DS.Model.extend({
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
        return 0;
      }

      return ((this.get('startTime').getTime() - this.get('createTime').getTime()) / 1000);
    }
  }),
  buildDuration: Ember.computed('startTime', 'endTime', {
    get() {
      if (!this.get('endTime')) {
        return 0;
      }

      return ((this.get('endTime').getTime() - this.get('startTime').getTime()) / 1000);
    }
  }),
  parameters: DS.attr(),
  meta: DS.attr(),
  steps: DS.attr(),
  status: DS.attr('string')
});
